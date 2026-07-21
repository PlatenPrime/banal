import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ApiClientError } from '../lib/api-client/client';
import { createExample } from '../lib/api-client/examples';
import { exampleKeys } from '../lib/api-client/query-keys';

export function NewExamplePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [apiErrors, setApiErrors] = useState<Record<string, string[]>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createExample,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: exampleKeys.all });
      await navigate({ to: '/examples' });
    },
    onError: (error) => {
      if (error instanceof ApiClientError && error.problem.errors) {
        setApiErrors(error.problem.errors);
        setSubmitError(null);
        return;
      }

      setSubmitError(error instanceof Error ? error.message : 'Create failed');
    },
  });

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
    },
    onSubmit: ({ value }) => {
      setApiErrors({});
      setSubmitError(null);
      mutation.mutate({
        name: value.name,
        description: value.description.trim() ? value.description : undefined,
      });
    },
  });

  return (
    <main>
      <h1>New example</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <div>
              <label htmlFor={field.name}>Name</label>
              <input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                required
              />
              {apiErrors.name?.map((message) => (
                <p key={message} role="alert">
                  {message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <div>
              <label htmlFor={field.name}>Description</label>
              <textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                rows={3}
              />
              {apiErrors.description?.map((message) => (
                <p key={message} role="alert">
                  {message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        {submitError ? <p role="alert">{submitError}</p> : null}

        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create'}
        </button>
      </form>
      <p>
        <Link to="/examples">Back to examples</Link>
      </p>
    </main>
  );
}
