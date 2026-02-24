import { getDatabase } from './mongodb'
import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'
import { randomBytes } from 'crypto'

// --- INTERFACES ---

export interface User {
  _id?: ObjectId
  username: string
  email: string
  passwordHash: string
  role: 'admin' | 'staff' | 'viewer'
  createdAt: string
  lastLogin?: string
}

export interface UserSession {
  userId: string
  username: string
  email: string
  role: string
}

export interface SessionDocument {
  _id?: ObjectId
  userId: ObjectId
  token: string
  expiresAt: Date
  createdAt: Date
}

// --- UTILITIES ---

/**
 * Normalizes date values from the database to ISO strings.
 * Prevents "toISOString is not a function" errors.
 */
const ensureISOString = (date: any): string => {
  if (!date) return new Date().toISOString();
  if (date instanceof Date) return date.toISOString();
  if (typeof date === 'string') return date;
  try {
    return new Date(date).toISOString();
  } catch {
    return new Date().toISOString();
  }
};

// --- USER LOOKUP FUNCTIONS ---

export async function getUserByUsername(username: string): Promise<User | null> {
  const db = await getDatabase()
  if (!db) throw new Error('Database not available')
  return db.collection<User>('users').findOne({ 
    username: username.toLowerCase() 
  })
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDatabase()
  if (!db) throw new Error('Database not available')
  return db.collection<User>('users').findOne({ 
    email: email.toLowerCase() 
  })
}

export async function getUserById(userId: string): Promise<User | null> {
  if (!ObjectId.isValid(userId)) return null
  const db = await getDatabase()
  if (!db) throw new Error('Database not available')
  return db.collection<User>('users').findOne({ _id: new ObjectId(userId) })
}

// --- AUTHENTICATION UTILITIES ---

export async function hashPassword(plainPassword: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(plainPassword, saltRounds)
}

export async function validatePassword(
  plainPassword: string, 
  passwordHash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, passwordHash)
  } catch (error) {
    console.error('Bcrypt validation error:', error)
    return false
  }
}

// --- USER MANAGEMENT ---

export async function createUser(
  username: string,
  email: string,
  plainPassword: string,
  role: 'admin' | 'staff' | 'viewer' = 'viewer'
): Promise<User> {
  const db = await getDatabase()
  if (!db) throw new Error('Database not available')

  const [existingUser, existingEmail] = await Promise.all([
    getUserByUsername(username),
    getUserByEmail(email)
  ])

  if (existingUser) throw new Error('Username already exists')
  if (existingEmail) throw new Error('Email already exists')

  const passwordHash = await hashPassword(plainPassword)

  const newUser: User = {
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
  }

  const result = await db.collection<User>('users').insertOne(newUser)
  return { ...newUser, _id: result.insertedId }
}

export async function updateLastLogin(userId: string): Promise<void> {
  const db = await getDatabase()
  if (!db || !ObjectId.isValid(userId)) return
  
  await db.collection('users').updateOne(
    { _id: new ObjectId(userId) },
    { $set: { lastLogin: new Date().toISOString() } }
  )
}

/**
 * UPDATED: Update user role (Required for admin dashboard)
 */
export async function updateUserRole(
  userId: string,
  role: 'admin' | 'staff' | 'viewer'
): Promise<boolean> {
  try {
    const db = await getDatabase()
    if (!db) throw new Error('Database not available')
    if (!ObjectId.isValid(userId)) return false

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role } }
    )

    // matchedCount is used because the role might be updated to the same value
    return result.matchedCount === 1
  } catch (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}

// --- SESSION MANAGEMENT ---

export async function createSession(userId: string): Promise<SessionDocument> {
  const db = await getDatabase()
  if (!db) throw new Error('Database not available')

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const session: SessionDocument = {
    userId: new ObjectId(userId),
    token,
    expiresAt,
    createdAt: new Date(),
  }

  await db.collection<SessionDocument>('sessions').insertOne(session)
  return session
}

export async function getSessionByToken(token: string): Promise<SessionDocument | null> {
  const db = await getDatabase()
  if (!db) throw new Error('Database not available')

  return await db.collection<SessionDocument>('sessions').findOne({
    token,
    expiresAt: { $gt: new Date() },
  })
}

export async function deleteSession(token: string): Promise<boolean> {
  const db = await getDatabase()
  if (!db) throw new Error('Database not available')

  const result = await db.collection('sessions').deleteOne({ token })
  return result.deletedCount === 1
}

// --- ADMIN & MAINTENANCE ---

export async function getAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
  const db = await getDatabase()
  if (!db) throw new Error('Database not available')

  const users = await db.collection<User>('users')
    .find({})
    .project({ passwordHash: 0 })
    .toArray()

  return users.map(user => ({
    ...user,
    _id: user._id,
    createdAt: ensureISOString(user.createdAt),
    lastLogin: user.lastLogin ? ensureISOString(user.lastLogin) : undefined
  })) as Omit<User, 'passwordHash'>[]
}

export async function deleteUser(userId: string): Promise<boolean> {
  if (!ObjectId.isValid(userId)) return false
  const db = await getDatabase()
  if (!db) throw new Error('Database not available')

  // Clean up all user sessions before deleting the user
  await db.collection('sessions').deleteMany({ userId: new ObjectId(userId) })
  
  const result = await db.collection('users').deleteOne({ _id: new ObjectId(userId) })
  return result.deletedCount === 1
}