-- FK em card para installment_purchases, recurring_templates e card_invoices
alter table installment_purchases add constraint fk_installment_card foreign key (card) references cards(name);
alter table recurring_templates add constraint fk_recurring_card foreign key (card) references cards(name);
alter table card_invoices add constraint fk_invoice_card foreign key (card) references cards(name);
