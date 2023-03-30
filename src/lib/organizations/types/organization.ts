interface Organization {
  id: number;
  name: string;
  timezone?: string;
  logoURL?: string | null;
  customerId?: number;
}

export default Organization;
