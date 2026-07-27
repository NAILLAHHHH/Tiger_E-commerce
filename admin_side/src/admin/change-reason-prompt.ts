import { tigerWearLightColors } from './theme';

type PromptOptions = {
  stock: boolean;
  price: boolean;
};

function changeSummary(options: PromptOptions): string {
  if (options.stock && options.price) return 'stock and price';
  if (options.stock) return 'stock';
  return 'price';
}

function changeLabel(options: PromptOptions): string {
  if (options.stock && options.price) return 'Stock & price update';
  if (options.stock) return 'Stock update';
  return 'Price update';
}

function placeholder(options: PromptOptions): string {
  if (options.stock && options.price) {
    return 'e.g. Restocked from supplier and corrected the retail price';
  }
  if (options.stock) {
    return 'e.g. Received 20 units from supplier · Damaged stock removed';
  }
  return 'e.g. Corrected pricing typo · New wholesale rate';
}

export function promptChangeReason(options: PromptOptions): Promise<string | null> {
  return new Promise((resolve) => {
    const red = tigerWearLightColors.primary500;
    const redHover = tigerWearLightColors.primary600;
    const redSoft = tigerWearLightColors.primary100;
    const redBorder = tigerWearLightColors.primary200;

    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'tigerwear-reason-title');
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(33,33,52,0.45)',
      'backdrop-filter:blur(2px)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'z-index:99999',
      'padding:20px',
      'box-sizing:border-box',
      'font-family:Inter,system-ui,-apple-system,sans-serif',
    ].join(';');

    const panel = document.createElement('div');
    panel.style.cssText = [
      'background:#fff',
      'border-radius:12px',
      'width:min(440px,100%)',
      'box-shadow:0 12px 40px rgba(33,33,52,0.18)',
      'overflow:hidden',
      'border:1px solid #eaeaef',
    ].join(';');

    const accent = document.createElement('div');
    accent.style.cssText = `height:4px;background:${red};`;

    const body = document.createElement('div');
    body.style.cssText = 'padding:22px 24px 20px;';

    const badge = document.createElement('div');
    badge.textContent = changeLabel(options);
    badge.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'margin:0 0 12px',
      'padding:4px 10px',
      'border-radius:999px',
      `background:${redSoft}`,
      `color:${redHover}`,
      `border:1px solid ${redBorder}`,
      'font-size:0.6875rem',
      'font-weight:600',
      'letter-spacing:0.02em',
      'text-transform:uppercase',
    ].join(';');

    const title = document.createElement('h2');
    title.id = 'tigerwear-reason-title';
    title.textContent = 'Why are you making this change?';
    title.style.cssText =
      'margin:0 0 8px;font-size:1.125rem;font-weight:600;color:#212134;line-height:1.3;';

    const hint = document.createElement('p');
    hint.textContent = `You updated ${changeSummary(options)}. Add a short note so it shows up clearly in stock history.`;
    hint.style.cssText =
      'margin:0 0 18px;color:#666687;font-size:0.875rem;line-height:1.45;';

    const field = document.createElement('div');
    field.style.cssText = 'display:flex;flex-direction:column;gap:6px;';

    const label = document.createElement('label');
    label.htmlFor = 'tigerwear-change-reason';
    label.textContent = 'Reason';
    label.style.cssText =
      'font-size:0.75rem;font-weight:600;color:#32324d;';

    const textarea = document.createElement('textarea');
    textarea.id = 'tigerwear-change-reason';
    textarea.rows = 3;
    textarea.placeholder = placeholder(options);
    textarea.style.cssText = [
      'width:100%',
      'box-sizing:border-box',
      'padding:10px 12px',
      'border:1px solid #dcdce4',
      'border-radius:6px',
      'font:inherit',
      'font-size:0.875rem',
      'line-height:1.4',
      'color:#212134',
      'resize:vertical',
      'min-height:84px',
      'outline:none',
      'transition:border-color 120ms ease, box-shadow 120ms ease',
    ].join(';');

    textarea.addEventListener('focus', () => {
      textarea.style.borderColor = red;
      textarea.style.boxShadow = `0 0 0 2px ${redSoft}`;
    });
    textarea.addEventListener('blur', () => {
      if (!error.hidden) return;
      textarea.style.borderColor = '#dcdce4';
      textarea.style.boxShadow = 'none';
    });

    const error = document.createElement('p');
    error.hidden = true;
    error.style.cssText = `margin:0;color:${redHover};font-size:0.75rem;font-weight:500;`;

    const actions = document.createElement('div');
    actions.style.cssText = [
      'display:flex',
      'justify-content:flex-end',
      'gap:10px',
      'margin-top:20px',
      'padding-top:16px',
      'border-top:1px solid #eaeaef',
    ].join(';');

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = [
      'padding:9px 16px',
      'border:1px solid #dcdce4',
      'border-radius:6px',
      'background:#fff',
      'color:#32324d',
      'font:inherit',
      'font-size:0.875rem',
      'font-weight:600',
      'cursor:pointer',
    ].join(';');
    cancelButton.addEventListener('mouseenter', () => {
      cancelButton.style.background = '#f6f6f9';
    });
    cancelButton.addEventListener('mouseleave', () => {
      cancelButton.style.background = '#fff';
    });

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.textContent = 'Save changes';
    saveButton.style.cssText = [
      'padding:9px 16px',
      'border:none',
      'border-radius:6px',
      `background:${red}`,
      'color:#fff',
      'font:inherit',
      'font-size:0.875rem',
      'font-weight:600',
      'cursor:pointer',
      'box-shadow:0 1px 2px rgba(232,36,36,0.25)',
    ].join(';');
    saveButton.addEventListener('mouseenter', () => {
      saveButton.style.background = redHover;
    });
    saveButton.addEventListener('mouseleave', () => {
      saveButton.style.background = red;
    });

    function cleanup() {
      overlay.remove();
      window.removeEventListener('keydown', onKeyDown);
    }

    function cancel() {
      cleanup();
      resolve(null);
    }

    function submit() {
      const value = textarea.value.trim();
      if (!value) {
        error.textContent = 'Please enter a reason before saving.';
        error.hidden = false;
        textarea.style.borderColor = red;
        textarea.style.boxShadow = `0 0 0 2px ${redSoft}`;
        textarea.focus();
        return;
      }
      cleanup();
      resolve(value);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        cancel();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        submit();
      }
    }

    textarea.addEventListener('input', () => {
      if (error.hidden) return;
      error.hidden = true;
      textarea.style.borderColor = red;
      textarea.style.boxShadow = `0 0 0 2px ${redSoft}`;
    });

    cancelButton.addEventListener('click', cancel);
    saveButton.addEventListener('click', submit);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) cancel();
    });
    window.addEventListener('keydown', onKeyDown);

    field.append(label, textarea, error);
    actions.append(cancelButton, saveButton);
    body.append(badge, title, hint, field, actions);
    panel.append(accent, body);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    textarea.focus();
  });
}
