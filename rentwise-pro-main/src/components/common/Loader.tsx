export function Loader({ size = 24 }: { size?: number }) {
  return (
    <div className="grid place-items-center p-8">
      <div
        className="rounded-full border-2 border-primary border-t-transparent animate-spin"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
