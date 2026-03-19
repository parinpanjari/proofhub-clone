import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config';
import { AppError } from './error.middleware';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (blockedExtensions.includes(ext)) {
    cb(new AppError('File type not allowed', 400));
    return;
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
});

export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', 10);
