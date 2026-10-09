import { faker } from '@faker-js/faker';

export interface CustomerData {
  first_name: string;
  last_name: string;
  dob: string;
  address: string;
  postcode: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  password: string;
}

export interface CheckoutAddress {
  address: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
}

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface PaymentDetails {
  paymentMethod: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
  cardHolderName: string;
}

function formatDateToIsoDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateCustomerData(overrides?: Partial<CustomerData>): CustomerData {
  const birthdate = faker.date.birthdate({ min: 18, max: 65, mode: 'age' });

  return {
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    dob: formatDateToIsoDateOnly(birthdate),
    address: faker.location.streetAddress(),
    postcode: '00-001',
    city: faker.location.city(),
    state: faker.location.state(),
    country: 'Poland',
    phone: faker.string.numeric(10),
    email: `customer_${Date.now()}_${faker.string.alphanumeric(6).toLowerCase()}@example.com`,
    password: `P@ss_${Date.now()}_${faker.string.alphanumeric(8)}!Aa`,
    ...overrides,
  };
}

export function generateCheckoutAddress(overrides?: Partial<CheckoutAddress>): CheckoutAddress {
  return {
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    country: faker.location.country(),
    postcode: faker.location.zipCode(),
    ...overrides,
  };
}

export function generateContactMessage(overrides?: Partial<ContactMessage>): ContactMessage {
  const subjects = [
    'Customer service',
    'Webmaster',
    'Return',
    'Warranty',
    'Status of order',
    'Payments',
  ];

  return {
    name: `${faker.person.firstName()} ${faker.person.lastName()}`,
    email: faker.internet.email().toLowerCase(),
    subject: faker.helpers.arrayElement(subjects),
    message: faker.lorem.paragraph({ min: 2, max: 4 }),
    ...overrides,
  };
}

export const validPaymentDetails: PaymentDetails = {
  paymentMethod: 'Credit Card',
  cardNumber: '1111-2222-3333-4444',
  expirationDate: '12/2028',
  cvv: '123',
  cardHolderName: 'Jane Doe',
};

export const paymentDetails = validPaymentDetails;

export function generatePaymentDetails(overrides?: Partial<PaymentDetails>): PaymentDetails {
  return {
    ...validPaymentDetails,
    ...overrides,
  };
}
