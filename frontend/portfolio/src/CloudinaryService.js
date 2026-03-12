const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Helper to generate SHA-1 signature for deletion
const generateSignature = async (public_id, timestamp) => {
  const string = `public_id=${public_id}&timestamp=${timestamp}${API_SECRET}`;
  const msgUint8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const uploadToCloudinary = async (file, tag) => {
  if (!file) return null;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('tags', tag);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Upload failed');
    return { url: data.secure_url, public_id: data.public_id };
  } catch (error) {
    console.error('Upload Error:', error);
    return null;
  }
};

export const fetchImagesByTag = async (tag) => {
  try {
    // Added cache buster to URL to fix incognito/update delay
    const response = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/${tag}.json?cb=${new Date().getTime()}`);
    if (response.status === 404) return [];
    const data = await response.json();
    return data.resources.map(res => ({
      url: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v${res.version}/${res.public_id}.${res.format}`,
      public_id: res.public_id,
      version: res.version // Include version for sorting
    }));
  } catch (error) {
    return [];
  }
};

export const deleteFromCloudinary = async (public_id) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = await generateSignature(public_id, timestamp);

  const formData = new FormData();
  formData.append('public_id', public_id);
  formData.append('timestamp', timestamp);
  formData.append('api_key', API_KEY);
  formData.append('signature', signature);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data.result === 'ok';
  } catch (error) {
    console.error('Delete Error:', error);
    return false;
  }
};
