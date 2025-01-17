import { useForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';

import {
  Button,
  Card,
  IconButton,
  Layout,
  Tooltip,
} from '@folio/stripes/components';
import { FormattedMessage } from 'react-intl';
import AgreementDocumentFilterField from './AgreementDocumentFilterField';

const AgreementDocumentFilterFieldArray = () => {
  const {
    mutators: { push },
  } = useForm();

  return (
    <>
      <FieldArray name="filters">
        {({ fields }) => fields.map((name, index) => {
          return (
            <>
              <Card
                key={`document-filter-card[${index}]`}
                headerEnd={
                    fields?.length > 1 ? (
                      <Tooltip
                        id={`document-filter-card-delete-[${index}]-tooltip`}
                        text={
                          <FormattedMessage
                            id="ui-agreements.documentFilter.deleteFilterIndex"
                            values={{ number: index + 1 }}
                          />
                        }
                      >
                        {({ ref, ariaIds }) => (
                          <IconButton
                            ref={ref}
                            aria-labelledby={ariaIds.text}
                            icon="trash"
                            id={`document-filter-card-delete-[${index}]`}
                            onClick={() => fields.remove(index)}
                          />
                        )}
                      </Tooltip>
                    ) : null
                  }
                headerStart={
                  <strong>
                    <FormattedMessage
                      id="ui-agreements.documentFilter.documentFilterIndex"
                      values={{ number: index + 1 }}
                    />
                  </strong>
                  }
                marginBottom0={index !== fields.length - 1}
              >
                <AgreementDocumentFilterField
                  fields={fields}
                  index={index}
                  name={name}
                />
              </Card>
              {index < fields.value.length - 1 && (
              <Layout className="textCentered">
                <FormattedMessage id="ui-agreements.OR" />
              </Layout>
              )}
            </>
          );
        })
        }
      </FieldArray>
      <Button onClick={() => push('filters', { rules: [{}] })}>
        <FormattedMessage id="ui-agreements.documentFilter.addFilter" />
      </Button>
    </>
  );
};

export default AgreementDocumentFilterFieldArray;
