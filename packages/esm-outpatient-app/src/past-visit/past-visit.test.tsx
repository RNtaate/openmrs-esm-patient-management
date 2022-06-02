import React from 'react';
import { screen } from '@testing-library/react';
import PastVisitSummary from './past-visit-details/past-visit-summary.component';
import userEvent from '@testing-library/user-event';
import { mockPatient } from '../../../../__mocks__/patient.mock';
import { mockPastVisit } from '../../__mocks__/visits.mock';
import { renderWithSwr } from '../../../../tools/test-helpers';
import { usePastVisits } from './past-visit.resource';

const mockUsePastVisits = usePastVisits as jest.Mock;

jest.mock('./past-visit.resource', () => ({
  usePastVisits: jest.fn(),
}));

describe('PastVisit: ', () => {
  it('renders an empty state when notes, encounters, medications, and vitals data is not available', async () => {
    mockUsePastVisits.mockReturnValueOnce({
      data: mockPastVisit.data.results,
    });

    renderPastVisitTabs();

    expect(screen.getByText(/vitals/i)).toBeInTheDocument();
    const vitalsTab = screen.getByRole('tab', { name: /vitals/i });
    const encountersTab = screen.getByRole('tab', { name: /encounters/i });

    expect(vitalsTab).toBeInTheDocument();

    expect(screen.getByRole('tab', { name: /notes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /medications/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^encounters$/i })).toBeInTheDocument();

    await userEvent.click(vitalsTab);

    expect(vitalsTab).toHaveAttribute('aria-selected', 'true');
    expect(encountersTab).toHaveAttribute('aria-selected', 'false');
  });
});

function renderPastVisitTabs() {
  renderWithSwr(<PastVisitSummary patientUuid={mockPatient.id} encounters={[]} />);
}
