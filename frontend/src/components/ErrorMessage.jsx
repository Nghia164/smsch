export default function ErrorMessage({ message }) {
  if (!message) return null;
  return <p className="mb-3 text-red-700">{message}</p>;
}
