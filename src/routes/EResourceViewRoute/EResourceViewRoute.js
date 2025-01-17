import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import { useQuery } from 'react-query';

import { useOkapiKy } from '@folio/stripes/core';

import { useInfiniteFetch, useParallelBatchFetch } from '@folio/stripes-erm-components';
import { generateKiwtQueryParams } from '@k-int/stripes-kint-components';

import View from '../../components/views/EResource';
import { parseMclPageSize, urls } from '../../components/utilities';

import {
  ERESOURCE_ENDPOINT,
  ERESOURCE_ENTITLEMENTS_ENDPOINT,
  ERESOURCE_ENTITLEMENT_OPTIONS_ENDPOINT,
  ERESOURCE_RELATED_ENTITLEMENTS_ENDPOINT,
  resourceClasses
} from '../../constants';
import { useAgreementsHelperApp, useAgreementsSettings, useSuppressFromDiscovery } from '../../hooks';

const EResourceViewRoute = ({
  handlers = [],
  history,
  location,
  match: { params: { id: eresourceId } },
}) => {
  const ky = useOkapiKy();
  const {
    handleToggleTags,
    HelperComponent,
    TagButton,
  } = useAgreementsHelperApp();

  const isSuppressFromDiscoveryEnabled = useSuppressFromDiscovery();

  const eresourcePath = ERESOURCE_ENDPOINT(eresourceId);

  const { data: eresource = {}, isLoading: isEresourceLoading } = useQuery(
    // NOTE Used in invalidateLinks for tags below!
    [eresourcePath, 'getEresource'],
    () => ky.get(eresourcePath).json()
  );

  const settings = useAgreementsSettings();

  const entitlementsPath = ERESOURCE_ENTITLEMENTS_ENDPOINT(eresourceId);
  const entitlementOptionsPath = ERESOURCE_ENTITLEMENT_OPTIONS_ENDPOINT(eresourceId);

  // AGREEMENTS FOR ERESOURCE INFINITE FETCH
  const eresourceAgreementParams = useMemo(() => (
    generateKiwtQueryParams(
      {
        perPage: parseMclPageSize(settings, 'entitlements')
      },
      {}
    )
  ), [settings]);

  const {
    infiniteQueryObject: {
      fetchNextPage: fetchNextEntitlementsPage,
      isLoading: areEntitlementsLoading
    },
    results: entitlements = [],
    total: entitlementsCount = 0
  } = useInfiniteFetch(
    [entitlementsPath, eresourceAgreementParams, 'ui-agreements', 'EresourceViewRoute', 'getEntitlements'],
    ({ pageParam = 0 }) => {
      const params = [...eresourceAgreementParams, `offset=${pageParam}`];
      return ky.get(`${entitlementsPath}?${params?.join('&')}`).json();
    }
  );

  // RELATED ENTITLEMENTS FOR ERESOURCE BATCH FETCH
  const { items: relatedEntitlements, isLoading: areRelatedEntitlementsLoading } = useParallelBatchFetch({
    generateQueryKey: ({ offset }) => ['ERM', 'Entitlements', ERESOURCE_RELATED_ENTITLEMENTS_ENDPOINT(eresourceId), offset, 'EresourceViewRoute'],
    endpoint: ERESOURCE_RELATED_ENTITLEMENTS_ENDPOINT(eresourceId),
    queryParams: {
      enabled: (!!eresource?.id && eresource?.class !== resourceClasses?.PACKAGE)
    }
  });

  // ENTITLEMENT OPTIONS FOR ERESOURCE INFINITE FETCH
  const eresourceEntitlementOptionsParams = useMemo(() => (
    generateKiwtQueryParams(
      {
        perPage: parseMclPageSize(settings, 'entitlementOptions')
      },
      {}
    )
  ), [settings]);

  const {
    infiniteQueryObject: {
      fetchNextPage: fetchNextEntitlementOptionsPage,
      isLoading: areEntitlementOptionsLoading
    },
    results: entitlementOptions = [],
    total: entitlementOptionsCount = 0
  } = useInfiniteFetch(
    [entitlementOptionsPath, eresourceEntitlementOptionsParams, 'ui-agreements', 'EresourceViewRoute', 'getEntitlementOptions'],
    ({ pageParam = 0 }) => {
      const params = [...eresourceEntitlementOptionsParams, `offset=${pageParam}`];
      return ky.get(`${entitlementOptionsPath}?${params?.join('&')}`).json();
    }
  );

  // PACKAGE CONTENTS FOR ERESOURCE
  const [contentFilter, setContentFilter] = useState('current');
  const packageContentPath = `erm/packages/${eresourceId}/content/${contentFilter}`;

  const packageContentsParams = useMemo(() => (
    generateKiwtQueryParams(
      {
        filters: [{
          path: 'pkg.id',
          value: eresourceId
        }],
        sort: [{
          path: 'pti.titleInstance.name'
        }],
        perPage: parseMclPageSize(settings, 'packageContents')
      },
      {}
    )
  ), [eresourceId, settings]);

  const {
    infiniteQueryObject: {
      fetchNextPage: fetchNextContentsPage,
      isLoading: areContentsLoading
    },
    results: packageContents = [],
    total: packageContentsCount = 0
  } = useInfiniteFetch(
    [packageContentPath, packageContentsParams, 'ui-agreements', 'EresourceViewRoute', 'getPackageContents'],
    ({ pageParam = 0 }) => {
      const params = [...packageContentsParams, `offset=${pageParam}`];
      return ky.get(`${packageContentPath}?${params?.join('&')}`).json();
    }
  );

  const handleClose = () => {
    if (location.pathname?.startsWith('/erm/titles')) {
      history.push(`${urls.titles()}${location.search}`);
    } else {
      history.push(`${urls.packages()}${location.search}`);
    }
  };

  const handleEdit = () => {
    // We currently only have edit for non-package resources
    history.push(`${urls.titleEdit(eresourceId)}${location.search}`);
  };

  /*
   * This method is currently only used in "Options for acquiring e-resource",
   * which is found on a Title view. This link could need to redirect to either
   * the packages OR the titles route, depending on context.
   */
  const handleEResourceClick = (id, destination = 'TITLE') => {
    if (destination === 'TITLE') {
      history.push(`${urls.titleView(id)}${location.search}`);
    } else {
      history.push(`${urls.packageView(id)}${location.search}`);
    }
  };

  const isLoading = () => {
    return (
      eresourceId !== eresource?.id &&
      isEresourceLoading
    );
  };

  const getTagsLink = () => {
    let resourceString;
    if (eresource.class === resourceClasses.TITLEINSTANCE) {
      resourceString = 'titles';
    } else if (eresource.class === resourceClasses.PCI) {
      resourceString = 'pci';
    }

    return `erm/${resourceString}/${eresourceId}`;
  };

  return (
    <View
      key={`eresource-view-pane-${eresourceId}`}
      components={{
        HelperComponent,
        TagButton
      }}
      data={{
        areEntitlementOptionsLoading,
        areEntitlementsLoading,
        areContentsLoading,
        areRelatedEntitlementsLoading,
        eresource,
        entitlementOptions,
        entitlementOptionsCount,
        entitlements,
        entitlementsCount,
        packageContentsFilter: contentFilter,
        packageContents,
        packageContentsCount,
        relatedEntitlements,
        searchString: location.search,
        tagsInvalidateLinks: [eresourcePath],
        tagsLink: getTagsLink(),
      }}
      handlers={{
        ...handlers,
        isSuppressFromDiscoveryEnabled,
        onFilterPackageContents: (path) => setContentFilter(path),
        onNeedMoreEntitlements: (_askAmount, index) => fetchNextEntitlementsPage({ pageParam: index }),
        onNeedMoreEntitlementOptions: (_askAmount, index) => fetchNextEntitlementOptionsPage({ pageParam: index }),
        onNeedMorePackageContents: (_askAmount, index) => fetchNextContentsPage({ pageParam: index }),
        onClose: handleClose,
        onEdit: handleEdit,
        onEResourceClick: handleEResourceClick,
        onToggleTags: handleToggleTags,
      }}
      isLoading={isLoading()}
    />
  );
};

EResourceViewRoute.propTypes = {
  handlers: PropTypes.object,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequired,
    search: PropTypes.string.isRequired
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string.isRequired,
    }).isRequired
  }).isRequired,
};


export default EResourceViewRoute;
