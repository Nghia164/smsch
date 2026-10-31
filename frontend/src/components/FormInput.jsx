export default function FormInput({ label, ...props }) {
  return (
    <label className="mb-3 block">
      <div className="mb-1 text-sm">{label}</div>
      <input
        className="w-full rounded-md border border-gray-300 p-2"
        {...props}
      />
    </label>
  );
}
