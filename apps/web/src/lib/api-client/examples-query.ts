import { queryOptions } from '@tanstack/react-query';
import { fetchExamples } from './examples';
import { exampleKeys } from './query-keys';

export const examplesQueryOptions = queryOptions({
  queryKey: exampleKeys.list(),
  queryFn: fetchExamples,
});
