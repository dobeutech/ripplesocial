import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Modal } from '../components/ui/modal';

describe('Button', () => {
  it('renders with children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByText('Primary');
    expect(btn.className).toContain('bg-emerald-600');
  });

  it('applies outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByText('Outline');
    expect(btn.className).toContain('border-emerald-600');
  });

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByText('Ghost');
    expect(btn.className).toContain('hover:bg-slate-100');
  });

  it('applies size classes', () => {
    render(<Button size="sm">Small</Button>);
    const btn = screen.getByText('Small');
    expect(btn.className).toContain('px-3');
  });

  it('handles click events', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is set', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Disabled</Button>);
    const btn = screen.getByText('Disabled');
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies cursor-pointer when onClick is provided', () => {
    const { container } = render(<Card onClick={() => {}}>Clickable</Card>);
    expect((container.firstChild as HTMLElement).className).toContain('cursor-pointer');
  });

  it('does not have cursor-pointer without onClick', () => {
    const { container } = render(<Card>Not clickable</Card>);
    expect((container.firstChild as HTMLElement).className).not.toContain('cursor-pointer');
  });
});

describe('CardHeader', () => {
  it('renders children with border', () => {
    render(<CardHeader>Header</CardHeader>);
    const el = screen.getByText('Header');
    expect(el.className).toContain('border-b');
  });
});

describe('CardContent', () => {
  it('renders children with padding', () => {
    render(<CardContent>Body</CardContent>);
    const el = screen.getByText('Body');
    expect(el.className).toContain('px-6');
  });
});

describe('CardFooter', () => {
  it('renders children with top border', () => {
    render(<CardFooter>Footer</CardFooter>);
    const el = screen.getByText('Footer');
    expect(el.className).toContain('border-t');
  });
});

describe('Input', () => {
  it('renders without label', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Input error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('applies error styling', () => {
    const { container } = render(<Input error="Error" />);
    const input = container.querySelector('input');
    expect(input?.className).toContain('border-red-500');
  });

  it('handles value changes', () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(onChange).toHaveBeenCalled();
  });
});

describe('Textarea', () => {
  it('renders with label', () => {
    render(<Textarea label="Message" placeholder="Type here" />);
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<Textarea error="Too short" />);
    expect(screen.getByText('Too short')).toBeInTheDocument();
  });

  it('applies error styling', () => {
    const { container } = render(<Textarea error="Error" />);
    const textarea = container.querySelector('textarea');
    expect(textarea?.className).toContain('border-red-500');
  });
});

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Modal isOpen={false} onClose={() => {}}>Content</Modal>);
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders content when open', () => {
    render(<Modal isOpen={true} onClose={() => {}}>Modal Content</Modal>);
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Test Title">Content</Modal>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose}>Content</Modal>);
    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Title">Content</Modal>);
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(b => b.querySelector('svg'));
    if (closeButton) fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });
});
