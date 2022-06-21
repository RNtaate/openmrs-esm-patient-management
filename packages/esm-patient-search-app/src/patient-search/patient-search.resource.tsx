import useSWRInfinite from 'swr/infinite';
import { FetchResponse, openmrsFetch } from '@openmrs/esm-framework';
import { useCallback, useMemo } from 'react';
import { SearchedPatient } from '../types';

interface PatientSearchResponse {
  data?: Array<SearchedPatient>;
  isLoading: boolean;
  fetchError: any;
  loadingNewData: boolean;
  hasMore: boolean;
  setPage: (size: number | ((_size: number) => number)) => Promise<
    FetchResponse<{
      results: Array<SearchedPatient>;
      links: Array<{
        rel: 'prev' | 'next';
      }>;
    }>[]
  >;
}

export function usePatientSearch(
  searchTerm: string,
  customRepresentation: string,
  includeDead: boolean,
  searching: boolean = true,
): PatientSearchResponse {
  const getUrl = useCallback(
    (
      page,
      prevPageData: FetchResponse<{ results: Array<SearchedPatient>; links: Array<{ rel: 'prev' | 'next' }> }>,
    ) => {
      if (prevPageData && !prevPageData?.data?.links.some((link) => link.rel === 'next')) {
        return null;
      }
      let url = `/ws/rest/v1/patient?q=${searchTerm}&v=${customRepresentation}&includeDead=${includeDead}&limit=10`;
      if (page) {
        url += `&startIndex=${page * 10}`;
      }
      return url;
    },
    [searchTerm, customRepresentation, includeDead],
  );
  const { data, isValidating, setSize, error } = useSWRInfinite<
    FetchResponse<{ results: Array<SearchedPatient>; links: Array<{ rel: 'prev' | 'next' }> }>
  >(searching ? getUrl : null, openmrsFetch);

  const results = useMemo(
    () => ({
      data: data ? [].concat(...data?.map((resp) => resp?.data?.results)) : null,
      isLoading: !data && !error,
      fetchError: error,
      hasMore: data?.length ? !!data[data.length - 1].data?.links?.some((link) => link.rel === 'next') : false,
      loadingNewData: isValidating,
      setPage: setSize,
    }),
    [data, isValidating, error],
  );
  console.log(results);
  return results;
}
