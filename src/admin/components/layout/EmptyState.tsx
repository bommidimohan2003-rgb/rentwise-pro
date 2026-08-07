import {
  EmptyState as BaseEmptyState,
  EmptyStateProps,
} from "@/components/states/EmptyState";

export function EmptyState(props: EmptyStateProps) {
  return <BaseEmptyState {...props} />;
}
