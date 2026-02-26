export interface IregisterPaitentpayload {
  name: string;
  email: string;
  password: string;
  // phoneNumber: string;
  // address: string;
}

export interface IloginPaitentpayload {
  email: string;
  password: string;
}

export interface IchangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
