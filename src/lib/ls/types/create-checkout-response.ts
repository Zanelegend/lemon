interface CreateCheckoutResponse {
  jsonapi: {
    version: string;
  };
  links: {
    self: string;
  };
  data: {
    type: 'checkouts';
    id: string;
    attributes: {
      store_id: number;
      variant_id: number;
      custom_price: null;
      product_options: {
        name: string;
        description: string;
        media: unknown[];
        redirect_url: string;
        receipt_button_text: string;
        receipt_link_url: string;
        receipt_thank_you_note: string;
        enabled_variants: string[];
      };
      checkout_options: {
        embed: boolean;
        media: boolean;
        logo: boolean;
        desc: boolean;
        discount: boolean;
        dark: boolean;
        subscription_preview: boolean;
        button_color: string;
      };
      checkout_data: {
        email: string;
        name: string;
        billing_address: string[];
        tax_number: string;
        discount_code: string;
        custom: unknown[];
      };
      expires_at: null | string;
      created_at: string;
      updated_at: string;
      test_mode: boolean;
      url: string;
    };
    relationships: {
      store: {
        links: {
          related: string;
          self: string;
        };
      };
      variant: {
        links: {
          related: string;
          self: string;
        };
      };
    };
    links: {
      self: string;
    };
  };
}

export default CreateCheckoutResponse;
