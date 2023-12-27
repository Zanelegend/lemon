interface Organization {
  id: number;
  uuid: string;
  name: string;
  logoURL?: string | null;
  customerId?: number;
}

export default Organization;
