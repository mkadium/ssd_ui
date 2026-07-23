type LoaderProps = {
  label?: string;
};

export function Loader({ label = "Loading..." }: LoaderProps) {
  return (
    <div className="common-loader" role="status" aria-live="polite">
      <span className="common-loader-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}