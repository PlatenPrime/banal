export const exampleKeys = {
  all: ['examples'] as const,
  list: () => [...exampleKeys.all, 'list'] as const,
};
