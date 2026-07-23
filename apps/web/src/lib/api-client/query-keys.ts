export const exampleKeys = {
  all: ['examples'] as const,
  list: () => [...exampleKeys.all, 'list'] as const,
};

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};
