import { render, screen } from '@testing-library/react';

import HomePage from '@/app/(public)/page';

describe('HomePage', () => {
  it('renders the Sprint 03 hero heading', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', {
        name: /find the right software with arlo in one guided chat/i,
      }),
    ).toBeInTheDocument();
  });
});
