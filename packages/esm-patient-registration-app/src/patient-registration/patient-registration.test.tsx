import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useConfig, usePatient } from '@openmrs/esm-framework';
import { PatientRegistration } from './patient-registration.component';
import { savePatient } from './patient-registration.resource';
import { mockPatient } from '../../../../__mocks__/patient.mock';
import { BrowserRouter } from 'react-router-dom';
import FormManager from './form-manager';
import { Resources, ResourcesContext } from '../offline.resources';

jest.mock('react-router-dom', () => ({
  ...(jest.requireActual('react-router-dom') as any),
  useLocation: () => ({
    pathname: 'openmrs/spa/patient-registration',
  }),
}));

jest.mock('@openmrs/esm-framework', () => {
  const originalModule = jest.requireActual('@openmrs/esm-framework');
  return {
    ...originalModule,
    useConfig: jest.fn().mockImplementation(() => mockOpenmrsConfig),
    usePatient: jest.fn().mockImplementation(() => ({
      isLoading: false,
      patient: mockPatient,
      patientUuid: mockPatient.id,
      error: null,
    })),
  };
});

jest.mock('./patient-registration.resource', () => ({
  savePatient: jest.fn(),
  usePatientPhoto: jest.fn().mockImplementation(() => ({
    data: null,
    isError: null,
    isLoading: false,
  })),
}));

const mockSavePatient = savePatient as jest.Mock;
const mockUseConfig = useConfig as jest.Mock;
const mockUsePatient = usePatient as jest.Mock;

const predefinedAddressTemplate = {
  results: [
    {
      value:
        '<org.openmrs.layout.address.AddressTemplate>\r\n     <nameMappings class="properties">\r\n       <property name="postalCode" value="Location.postalCode"/>\r\n       <property name="address2" value="Location.address2"/>\r\n       <property name="address1" value="Location.address1"/>\r\n       <property name="country" value="Location.country"/>\r\n       <property name="stateProvince" value="Location.stateProvince"/>\r\n       <property name="cityVillage" value="Location.cityVillage"/>\r\n     </nameMappings>\r\n     <sizeMappings class="properties">\r\n       <property name="postalCode" value="4"/>\r\n       <property name="address1" value="40"/>\r\n       <property name="address2" value="40"/>\r\n       <property name="country" value="10"/>\r\n       <property name="stateProvince" value="10"/>\r\n       <property name="cityVillage" value="10"/>\r\n       <asset name="cityVillage" value="10"/>\r\n     </sizeMappings>\r\n     <lineByLineFormat>\r\n       <string>address1 address2</string>\r\n       <string>cityVillage stateProvince postalCode</string>\r\n       <string>country</string>\r\n     </lineByLineFormat>\r\n     <elementDefaults class="properties">\r\n            <property name="country" value=""/>\r\n     </elementDefaults>\r\n     <elementRegex class="properties">\r\n            <property name="address1" value="[a-zA-Z]+$"/>\r\n     </elementRegex>\r\n     <elementRegexFormats class="properties">\r\n            <property name="address1" value="Countries can only be letters"/>\r\n     </elementRegexFormats>\r\n   </org.openmrs.layout.address.AddressTemplate>',
    },
  ],
};

const mockResourcesContextValue = {
  addressTemplate: predefinedAddressTemplate,
  currentSession: { authenticated: true, sessionId: 'JSESSION' },
  relationshipTypes: [],
  identifierTypes: [],
} as Resources;

let mockOpenmrsConfig = {
  sections: ['demographics', 'contact'],
  sectionDefinitions: [
    { id: 'demographics', name: 'Demographics', fields: ['name', 'gender', 'dob'] },
    { id: 'contact', name: 'Contact Info', fields: ['address'] },
    { id: 'relationships', name: 'Relationships', fields: ['relationship'] },
  ],
  fieldConfigurations: {
    name: {
      displayMiddleName: true,
    },
  },
  concepts: {
    patientPhotoUuid: '736e8771-e501-4615-bfa7-570c03f4bef5',
  },
};

const path = `/patient/:patientUuid/edit`;

describe('patient registration', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <ResourcesContext.Provider value={mockResourcesContextValue}>
          <PatientRegistration isOffline={false} savePatientForm={jest.fn()} />
        </ResourcesContext.Provider>
      </BrowserRouter>,
    );
  });

  it('has the expected sections', async () => {
    mockUseConfig.mockReturnValue(mockOpenmrsConfig);

    render(
      <BrowserRouter>
        <ResourcesContext.Provider value={mockResourcesContextValue}>
          <PatientRegistration isOffline={false} savePatientForm={jest.fn()} />
        </ResourcesContext.Provider>
      </BrowserRouter>,
    );

    await waitFor(() => expect(screen.getByLabelText(/Demographics Section/)).not.toBeNull());
    expect(screen.getByLabelText(/Contact Info Section/)).not.toBeNull();
  });
});

describe('form submit', () => {
  const fillRequiredFields = async (getByLabelText) => {
    const givenNameInput = getByLabelText('givenNameLabelText') as HTMLInputElement;
    const familyNameInput = getByLabelText('familyNameLabelText') as HTMLInputElement;
    const dateOfBirthInput = getByLabelText('dateOfBirthLabelText') as HTMLInputElement;
    const genderInput = getByLabelText('Male') as HTMLSelectElement;

    await userEvent.type(givenNameInput, 'Paul');
    await userEvent.type(familyNameInput, 'Gaihre');
    await userEvent.type(dateOfBirthInput, '1993-08-02');
    fireEvent.click(genderInput);
  };

  beforeAll(() => {
    mockUseConfig.mockReturnValue(mockOpenmrsConfig);
  });

  it.skip('saves the patient without extra info', async () => {
    mockSavePatient.mockResolvedValueOnce({});

    render(<PatientRegistration isOffline={false} savePatientForm={jest.fn()} />);

    fillRequiredFields(screen.getByLabelText);
    await userEvent.click(await screen.findByText('Register Patient'));

    waitFor(() => {
      expect(mockSavePatient).toHaveBeenCalledWith(
        expect.anything(),
        {
          identifiers: [], //TODO when the identifer story is finished: { identifier: '', identifierType: '05a29f94-c0ed-11e2-94be-8c13b969e334', location: '' }
          // identifiers: [{ identifier: '', identifierType: '05a29f94-c0ed-11e2-94be-8c13b969e334', location: '' }],
          person: {
            addresses: [
              { address1: '', address2: '', cityVillage: '', country: '', postalCode: '', stateProvince: '' },
            ],
            attributes: [],
            birthdate: '1993-08-02',
            birthdateEstimated: false,
            gender: 'M',
            names: [{ givenName: 'Paul', middleName: '', familyName: 'Gaihre', preferred: true }],
            dead: false,
          },
        },
        undefined,
      );
    });
  });

  it('should not save the patient if validation fails', async () => {
    mockSavePatient.mockResolvedValueOnce({});

    render(
      <BrowserRouter>
        <ResourcesContext.Provider value={mockResourcesContextValue}>
          <PatientRegistration isOffline={false} savePatientForm={jest.fn()} />
        </ResourcesContext.Provider>
      </BrowserRouter>,
    );

    await userEvent.click(screen.getByText('Register Patient'));

    expect(mockSavePatient).not.toHaveBeenCalled();
  });

  it.skip('edits patient demographics', async () => {
    mockSavePatient.mockResolvedValueOnce({});
    mockUsePatient.mockReturnValueOnce({
      isLoading: false,
      patient: mockPatient,
      patientUuid: mockPatient.id,
      error: null,
    });

    render(
      <BrowserRouter>
        <ResourcesContext.Provider value={mockResourcesContextValue}>
          <PatientRegistration isOffline={false} savePatientForm={FormManager.savePatientFormOnline} />
        </ResourcesContext.Provider>
      </BrowserRouter>,
    );

    const givenNameInput = screen.getByLabelText('Given Name') as HTMLInputElement;
    const familyNameInput = screen.getByLabelText('Family Name') as HTMLInputElement;
    const middleNameInput = screen.getByLabelText('Middle Name') as HTMLInputElement;
    const dateOfBirthInput = screen.getByLabelText('Date of Birth') as HTMLInputElement;
    const address1 = screen.getByLabelText('Location.address1') as HTMLInputElement;

    // assert initial values
    expect(givenNameInput.value).toBe('John');
    expect(familyNameInput.value).toBe('Wilson');
    expect(middleNameInput.value).toBeFalsy();
    expect(dateOfBirthInput.value).toBe('04/04/1972');

    // do some edits
    await userEvent.clear(givenNameInput);
    await userEvent.clear(middleNameInput);
    await userEvent.clear(familyNameInput);
    await userEvent.type(givenNameInput, 'Eric');
    await userEvent.type(middleNameInput, 'Johnson');
    await userEvent.type(familyNameInput, 'Smith');
    await userEvent.type(address1, 'Bom Jesus Street');
    await userEvent.click(screen.getByText('Update Patient'));

    expect(mockSavePatient).toHaveBeenCalledWith(
      expect.anything(),
      {
        uuid: '8673ee4f-e2ab-4077-ba55-4980f408773e',
        identifiers: [
          {
            uuid: '1f0ad7a1-430f-4397-b571-59ea654a52db',
            identifier: '100GEJ',
            identifierType: 'e5af9a9c-ff9d-486d-900c-5fbf66a5ba3c',
            preferred: true,
          },
          {
            uuid: '1f0ad7a1-430f-4397-b571-59ea654a52db',
            identifier: '100732HE',
            identifierType: '3ff0063c-dd45-4d98-8af4-0c094f26166c',
            preferred: false,
          },
        ],
        person: {
          addresses: [
            {
              address1: 'Bom Jesus Street',
              address2: '',
              cityVillage: 'City0351',
              country: 'Country0351',
              postalCode: '60351',
              stateProvince: 'State0351tested',
            },
          ],
          attributes: [],
          birthdate: new Date('1972-04-04'),
          birthdateEstimated: false,
          gender: 'M',
          names: [
            {
              uuid: 'efdb246f-4142-4c12-a27a-9be60b9592e9',
              givenName: 'Eric',
              middleName: 'Johnson',
              familyName: 'Smith',
              preferred: true,
            },
          ],
          dead: false,
          uuid: '8673ee4f-e2ab-4077-ba55-4980f408773e',
        },
      },
      '8673ee4f-e2ab-4077-ba55-4980f408773e',
    );
  });
});
