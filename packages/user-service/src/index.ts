import fastify from 'fastify';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import fastifyJwt from '@fastify/jwt';

const server = fastify({ logger: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'your-super-secret-key-that-is-long',
});

// --- User Registration ---
server.post('/register', async (request, reply) => {
  const { email, password } = request.body as any;

  if (!email || !password) {
    return reply.status(400).send({ message: 'Email and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );
    return reply.status(201).send(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return reply.status(409).send({ message: 'User with this email already exists' });
    }
    server.log.error(error);
    return reply.status(500).send({ message: 'Internal server error' });
  }
});

// --- User Login ---
server.post('/login', async (request, reply) => {
  const { email, password } = request.body as any;

  if (!email || !password) {
    return reply.status(400).send({ message: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return reply.status(401).send({ message: 'Invalid credentials' });
    }

    const token = server.jwt.sign({ id: user.id, email: user.email });
    return { token };

  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ message: 'Internal server error' });
  }
});


const start = async () => {
  try {
    // Note: In docker-compose, the service name 'user-service' is used.
    // For local development, you might use 'localhost'.
    // 0.0.0.0 is used to bind to all available network interfaces.
    await server.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();