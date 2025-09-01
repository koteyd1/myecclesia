import { renderToString } from 'react-dom/server';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

export function render(url: string) {
  const html = renderToString(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  return { html };
}