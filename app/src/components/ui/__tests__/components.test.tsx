import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';
import { StatusBadge } from '../StatusBadge';
import { SeatIndicator } from '../SeatIndicator';
import { Chip } from '../Chip';
import { Card } from '../Card';

describe('UI Primitives', () => {
  describe('Button', () => {
    it('renders title correctly and handles press', async () => {
      const onPressMock = jest.fn();
      await render(<Button title="Click Me" onPress={onPressMock} />);

      const button = screen.getByText('Click Me');
      expect(button).toBeTruthy();
      fireEvent.press(button);
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('does not fire onPress when disabled or loading', async () => {
      const onPressMock = jest.fn();
      await render(<Button title="Disabled" disabled onPress={onPressMock} />);

      const button = screen.getByRole('button');
      fireEvent.press(button);
      expect(onPressMock).not.toHaveBeenCalled();
    });
  });

  describe('StatusBadge', () => {
    it('renders with appropriate status label', async () => {
      await render(<StatusBadge status="open" />);
      expect(screen.getByText('Open')).toBeTruthy();
    });

    it('renders booked status correctly', async () => {
      await render(<StatusBadge status="booked" />);
      expect(screen.getByText('Cab booked')).toBeTruthy();
    });
  });

  describe('SeatIndicator', () => {
    it('displays correct seats left message', async () => {
      await render(<SeatIndicator totalSeats={4} seatsTaken={2} />);
      expect(screen.getByText('2 seats left')).toBeTruthy();
    });

    it('displays Full when seats are filled', async () => {
      await render(<SeatIndicator totalSeats={4} seatsTaken={4} />);
      expect(screen.getByText('Full')).toBeTruthy();
    });
  });

  describe('Chip', () => {
    it('renders label and fires onPress', async () => {
      const onPressMock = jest.fn();
      await render(<Chip label="Terminal 3" onPress={onPressMock} />);

      const chip = screen.getByText('Terminal 3');
      expect(chip).toBeTruthy();
      fireEvent.press(chip);
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Card', () => {
    it('renders children correctly', async () => {
      await render(
        <Card>
          <Button title="Inside Card" onPress={() => {}} />
        </Card>
      );
      expect(screen.getByText('Inside Card')).toBeTruthy();
    });
  });
});
