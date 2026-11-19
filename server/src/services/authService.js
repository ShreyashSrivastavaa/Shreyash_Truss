import prisma from '../db.js';
import { hashPassword, verifyPassword, createToken } from '../utils/crypto.js';

/**
 * Registers a new user account in PostgreSQL.
 *
 * @param {Object} data
 * @param {import('@prisma/client').PrismaClient} [client=prisma]
 * @returns {Promise<{ user: Object, token: string }>}
 */
export async function registerUser(data, client = prisma) {
  const existing = await client.user.findUnique({
    where: { email: data.email }
  });

  if (existing) {
    const error = new Error(`An account with email '${data.email}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  if (data.depotId) {
    const depot = await client.depot.findUnique({
      where: { id: data.depotId }
    });
    if (!depot) {
      const error = new Error(`Depot '${data.depotId}' does not exist`);
      error.statusCode = 400;
      throw error;
    }
  }

  const passwordHash = await hashPassword(data.password);

  const createdUser = await client.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role || 'VIEWER',
      depotId: data.depotId || null
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      depotId: true,
      createdAt: true
    }
  });

  const token = createToken({
    sub: createdUser.id,
    email: createdUser.email,
    role: createdUser.role,
    depotId: createdUser.depotId
  });

  return {
    user: createdUser,
    token
  };
}

/**
 * Authenticates user credentials against stored PostgreSQL hash and issues a bearer token.
 *
 * @param {{ email: string, password: string }} credentials
 * @param {import('@prisma/client').PrismaClient} [client=prisma]
 * @returns {Promise<{ user: Object, token: string }>}
 */
export async function loginUser({ email, password }, client = prisma) {
  const user = await client.user.findUnique({
    where: { email }
  });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const userProfile = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    depotId: user.depotId,
    createdAt: user.createdAt
  };

  const token = createToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    depotId: user.depotId
  });

  return {
    user: userProfile,
    token
  };
}

/**
 * Retrieves user profile by ID from PostgreSQL.
 *
 * @param {string} userId
 * @param {import('@prisma/client').PrismaClient} [client=prisma]
 * @returns {Promise<Object>}
 */
export async function getUserProfile(userId, client = prisma) {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      depotId: true,
      createdAt: true
    }
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
}
