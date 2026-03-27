import { fileToDataUrl } from '../utils/file';

export default function ImageInput({ multiple = false, onChange }) {
  const handleChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (multiple) {
      const urls = await Promise.all(files.map(fileToDataUrl));
      onChange(urls);
      return;
    }

    const url = await fileToDataUrl(files[0]);
    onChange(url);
  };

  return <input type="file" accept="image/*" multiple={multiple} onChange={handleChange} />;
}
