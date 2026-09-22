import { Component } from '@angular/core';

/** Catch-all when the URL is not a tab. Leave via the existing nav. */
@Component({
  selector: 'app-not-found',
  styles: `
    h1 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem;
    }

    p {
      margin: 0;
    }
  `,
  template: `
    <h1>Page not found</h1>
    <p>That path isn't one of the app tabs.</p>
  `,
})
export class NotFound {}
