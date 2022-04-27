import { OpenmrsResource } from '@openmrs/esm-framework';

export interface Patient {
  patientId: number;
  uuid: string;
  identifiers: Array<Identifier>;
  patientIdentifier: { identifier: string };
  person: {
    addresses: Array<Address>;
    age: number;
    birthdate: string;
    display: string;
    gender: string;
    death: boolean;
    deathDate: string;
    personName: {
      givenName: string;
      familyName: string;
      middleName: string;
    };
  };
  attributes: Array<Attribute>;
  display: string;
}

export interface Identifier {
  display: string;
  uuid: string;
  identifier: string;
  identifierType: {
    uuid: string;
    display: string;
  };
  location: {
    uuid: string;
    display: string;
  };
  preferred: boolean;
  voided: boolean;
}

export interface Address {
  preferred: boolean;
  cityVillage: string;
  country: string;
  postalCode: string;
  stateProvince: string;
}
export interface Attribute {
  attributeType: OpenmrsResource;
  display: string;
  uuid: string;
  value: string | number;
}
