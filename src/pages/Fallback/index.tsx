import { useRouteError, isRouteErrorResponse, Link } from 'react-router';

export default function ErrorBoundary() {
  const error = useRouteError();

  let errorMessage = 'Um erro inesperado ocorreu.';
  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="rounded-xl bg-white p-8 text-center shadow-xl">
        <h1 className="text-4xl font-bold text-red-600">Oops!</h1>
        <p className="mt-4 text-lg text-gray-700">Desculpe, ocorreu um erro.</p>
        <p className="mt-2 text-gray-500">
          <i>{errorMessage}</i>
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
