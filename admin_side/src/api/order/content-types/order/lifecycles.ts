function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TW-${date}-${rand}`;
}

export default {
  beforeCreate(event) {
    const { data } = event.params;

    if (!data.order_number) {
      data.order_number = generateOrderNumber();
    }

    if (!data.status) {
      data.status = 'pending_contact';
    }
  },
};
