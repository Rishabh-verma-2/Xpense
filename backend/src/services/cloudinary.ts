import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'xpense',
  api_key: process.env.CLOUDINARY_API_KEY || '733877715338262',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'lWv40ZZIVbY16h5e_ecal68KJFU',
  secure: true,
});

export { cloudinary };

export async function uploadImageToCloudinary(
  fileOrBase64: string,
  folder = 'xpense_avatars'
): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(fileOrBase64, {
      folder,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
    return result.secure_url;
  } catch (error: any) {
    console.error('[Cloudinary] Upload error:', error);
    throw new Error(error.message || 'Failed to upload image to Cloudinary');
  }
}
