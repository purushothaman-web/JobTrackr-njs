import jwt from 'jsonwebtoken';

interface UserPayload {
  id: number;
  email: string;
  name: string;
}

const generateToken = (user: UserPayload): string => {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.name },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
};

export default generateToken;
