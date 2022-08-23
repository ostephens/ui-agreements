import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { FormattedMessage } from 'react-intl';
import { useQuery } from 'react-query';

import { useOkapiKy } from '@folio/stripes/core';

import { Accordion, AccordionSet, FilterAccordionHeader, Layout, Spinner } from '@folio/stripes/components';
import { CheckboxFilter, MultiSelectionFilter } from '@folio/stripes/smart-components';
import { DateFilter, useAgreement } from '@folio/stripes-erm-components';

import AgreementFilterButton from '../AgreementFilterButton';
import POLineFilterButton from '../POLineFilterButton';

const propTypes = {
  activeFilters: PropTypes.object,
  data: PropTypes.object.isRequired,
  filterHandlers: PropTypes.object,
  name: PropTypes.string,
  value: PropTypes.string
};

const AgreementLineFilters = ({
  activeFilters = {},
  data,
  filterHandlers
}) => {
  const ky = useOkapiKy();

  const [filterState, setFilterState] = useState({
    lineType: [
      {
        value: 'type==detached',
        label: <FormattedMessage id="ui-agreements.agreementLines.lineType.detached" />
      },
      {
        value: 'type==external',
        label: <FormattedMessage id="ui-agreements.agreementLines.lineType.external" />
      },
      {
        value: 'type isNull',
        label: <FormattedMessage id="ui-agreements.agreementLines.lineType.internal" />
      }],
    tags: []
  });

  const [agreementFilterName, setAgreementFilterName] = useState();
  const agreementId = activeFilters?.agreement?.[0];
  const poLineId = activeFilters?.poLine?.[0];
  const poLinePath = `orders/order-lines/${poLineId}`;
  const [poLineFilterNumber, setPOLineFilterNumber] = useState();

  const { isAgreementLoading } = useAgreement({
    agreementId,
    afterQueryCall: (res) => {
      setAgreementFilterName(res.name);
    },
    queryOptions: { enabled: !!agreementId && !agreementFilterName }
  });


  const { isLoading: isPOLineLoading } = useQuery(
    ['Orders', 'POLine', poLineId, poLinePath],
    () => ky.get(poLinePath).json().then(res => {
      setPOLineFilterNumber(res?.poLineNumber);
    }),
    { enabled: !!poLineId && !poLineFilterNumber }
  );

  useEffect(() => {
    const newState = {};
    if ((data?.tagsValues?.length ?? 0) !== filterState.tags?.length) {
      newState.tags = data.tagsValues.map(({ label }) => ({ value: label, label }));
    }

    if (Object.keys(newState).length) {
      setFilterState(prevState => ({ ...prevState, ...newState }));
    }
  }, [data, filterState]);

  const renderCheckboxFilter = (name, prps) => {
    const groupFilters = activeFilters[name] || [];

    return (
      <Accordion
        displayClearButton={groupFilters.length > 0}
        header={FilterAccordionHeader}
        id={`filter-accordion-${name}`}
        label={<FormattedMessage id={`ui-agreements.agreementLines.${name}`} />}
        onClearFilter={() => { filterHandlers.clearGroup(name); }}
        separator={false}
        {...prps}
      >
        <CheckboxFilter
          dataOptions={filterState[name] || []}
          name={name}
          onChange={(group) => {
            filterHandlers.state({
              ...activeFilters,
              [group.name]: group.values
            });
          }}
          selectedValues={groupFilters}
        />
      </Accordion>
    );
  };

  const renderPOLineFilter = (name, props) => {
    const groupFilters = activeFilters[name] || [];

    const displayPOLineNumber = () => {
      if (isPOLineLoading) {
        return <Spinner />;
      }

      if (poLineFilterNumber) {
        return (
          <Layout className="padding-bottom-gutter">
            {poLineFilterNumber}
          </Layout>
        );
      }

      return null;
    };

    return (
      <Accordion
        displayClearButton={groupFilters.length > 0}
        header={FilterAccordionHeader}
        id="filter-accordion-po-lines"
        label={<FormattedMessage id="ui-agreements.agreementLines.poLine" />}
        name={name}
        onClearFilter={() => {
          filterHandlers.clearGroup(name);
          setPOLineFilterNumber();
        }}
        separator={false}
        {...props}
      >
        {displayPOLineNumber()}
        <POLineFilterButton
          disabled={!!poLineFilterNumber || isPOLineLoading}
          name={name}
          onPOLineSelected={(poLine) => {
            filterHandlers.state({ ...activeFilters, [name]: [poLine.id] });
            setPOLineFilterNumber(poLine.poLineNumber);
          }}
        />
      </Accordion>
    );
  };

  const renderAgreementFilter = (name, props) => {
    const groupFilters = activeFilters[name] || [];

    const displayAgreementName = () => {
      if (isAgreementLoading) {
        return <Spinner />;
      }

      if (agreementFilterName) {
        return (
          <Layout className="padding-bottom-gutter">
            {agreementFilterName}
          </Layout>
        );
      }

      return null;
    };

    return (
      <Accordion
        displayClearButton={groupFilters.length > 0}
        header={FilterAccordionHeader}
        id={`filter-accordion-${name}`}
        label={<FormattedMessage id="ui-agreements.agreement" />}
        name={name}
        onClearFilter={() => {
          filterHandlers.clearGroup(name);
          setAgreementFilterName();
        }}
        separator={false}
        {...props}
      >
        {displayAgreementName()}
        <AgreementFilterButton
          disabled={!!agreementFilterName || isAgreementLoading}
          name={name}
          onAgreementSelected={(agreement) => {
            filterHandlers.state({ ...activeFilters, [name]: [agreement.id] });
            setAgreementFilterName(agreement.name);
          }}
        />
      </Accordion>
    );
  };

  const renderDateFilter = (name) => {
    return <DateFilter
      accordionLabel={<FormattedMessage id={`ui-agreements.agreementLines.${name}`} />}
      activeFilters={activeFilters}
      filterHandlers={filterHandlers}
      name={name}
      noDateSetCheckboxLabel={<FormattedMessage id={`ui-agreements.agreementLines.${name}.includeNoDateSet`} />}
    />;
  };

  const renderTagsFilter = () => {
    const tagFilters = activeFilters.tags || [];

    return (
      <Accordion
        closedByDefault
        displayClearButton={tagFilters.length > 0}
        header={FilterAccordionHeader}
        id="clickable-tags-filter"
        label={<FormattedMessage id="ui-agreements.agreements.tags" />}
        onClearFilter={() => { filterHandlers.clearGroup('tags'); }}
        separator={false}
      >
        <MultiSelectionFilter
          dataOptions={filterState.tags || []}
          id="tags-filter"
          name="tags"
          onChange={e => filterHandlers.state({ ...activeFilters, tags: e.values })}
          selectedValues={tagFilters}
        />
      </Accordion>
    );
  };

  return (
    <AccordionSet>
      {renderAgreementFilter('agreement')}
      {renderCheckboxFilter('lineType')}
      {renderDateFilter('activeFrom')}
      {renderDateFilter('activeTo')}
      {renderPOLineFilter('poLine')}
      {renderTagsFilter()}
    </AccordionSet>
  );
};

AgreementLineFilters.propTypes = propTypes;

export default AgreementLineFilters;
