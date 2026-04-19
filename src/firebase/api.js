import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from './config.js'

const toolsCol = () => collection(db, 'tools')
const likesCol = () => collection(db, 'likes')

function likeDocId(userId, toolId) {
  return `${userId}_${toolId}`
}

/**
 * @returns {Promise<Array<{ id: string } & Record<string, unknown>>>}
 */
export async function getTools() {
  try {
    const q = query(toolsCol(), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('[getTools]', err)
    throw err
  }
}

/**
 * @param {string} userId
 * @returns {Promise<Array<{ id: string } & Record<string, unknown>>>}
 */
export async function getUserTools(userId) {
  try {
    const q = query(
      toolsCol(),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.error('[getUserTools]', err)
    throw err
  }
}

/**
 * @param {Record<string, unknown>} toolData
 * @returns {Promise<string>} new document id
 */
export async function createTool(toolData) {
  try {
    const payload = {
      ...toolData,
      likesCount: toolData.likesCount ?? 0,
      createdAt: toolData.createdAt ?? serverTimestamp(),
    }
    const ref = await addDoc(toolsCol(), payload)
    return ref.id
  } catch (err) {
    console.error('[createTool]', err)
    throw err
  }
}

/**
 * @param {string} toolId
 * @returns {Promise<void>}
 */
export async function deleteTool(toolId) {
  try {
    await deleteDoc(doc(db, 'tools', toolId))
  } catch (err) {
    console.error('[deleteTool]', err)
    throw err
  }
}

/**
 * Toggles a like for the given user/tool pair and updates `likesCount` on the tool.
 * Uses a deterministic like document id: `${userId}_${toolId}`.
 *
 * @param {string} userId
 * @param {string} toolId
 * @returns {Promise<{ liked: boolean }>}
 */
export async function toggleLike(userId, toolId) {
  const likeRef = doc(db, 'likes', likeDocId(userId, toolId))
  const toolRef = doc(db, 'tools', toolId)

  try {
    const liked = await runTransaction(db, async (transaction) => {
      const toolSnap = await transaction.get(toolRef)
      if (!toolSnap.exists()) {
        throw new Error(`Tool not found: ${toolId}`)
      }

      const likeSnap = await transaction.get(likeRef)

      if (likeSnap.exists()) {
        transaction.delete(likeRef)
        transaction.update(toolRef, { likesCount: increment(-1) })
        return false
      }

      transaction.set(likeRef, {
        userId,
        toolId,
        createdAt: serverTimestamp(),
      })
      transaction.update(toolRef, { likesCount: increment(1) })
      return true
    })

    return { liked }
  } catch (err) {
    console.error('[toggleLike]', err)
    throw err
  }
}
