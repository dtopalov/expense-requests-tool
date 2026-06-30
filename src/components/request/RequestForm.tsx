import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { RequestValues } from '../../models/request.ts';
import { EXPENSE_TYPES, CLIENTS, LARGE_AMOUNT_THRESHOLD_CENTS } from '../../models/constants.ts';
import { validateRequestValues, hasErrors } from '../../validation/request.validation.ts';
import { TextField } from '../form/TextField.tsx';
import { MoneyField } from '../form/MoneyField.tsx';
import { SelectField } from '../form/SelectField.tsx';
import { CheckboxField } from '../form/CheckboxField.tsx';
import { TextAreaField } from '../form/TextAreaField.tsx';
import { WhyRequired } from '../form/WhyRequired.tsx';
import { Button } from '../common/Button.tsx';
import { useToast } from '../common/Toast.tsx';
import { ApiRequestError } from '../../api/client.ts';
import type { ValidationErrors } from '../../validation/request.validation.ts';

const EXPENSE_TYPE_OPTIONS = EXPENSE_TYPES.map(t => ({ value: t, label: t }));
const CLIENT_OPTIONS = CLIENTS.map(c => ({ value: c, label: c }));

interface RequestFormProps {
  initialValues?: RequestValues;
  requestId?: string;
  onSave: (values: RequestValues) => Promise<{ id: string }>;
  onSubmit: (id: string) => Promise<unknown>;
  mode: 'create' | 'edit';
}

export function RequestForm({
  initialValues = {},
  requestId,
  onSave,
  onSubmit,
  mode
}: RequestFormProps): React.ReactElement {
  const [values, setValues] = useState<RequestValues>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const firstErrorRef = useRef<HTMLElement | null>(null);

  const isValid = !hasErrors(validateRequestValues(values));
  const amountCents = values.amountCents ?? 0;
  const showClient = values.billable === true;
  const showJustification = amountCents >= LARGE_AMOUNT_THRESHOLD_CENTS;
  const showOtherReason = values.expenseType === 'Other';
  const showTravelFields = values.expenseType === 'Travel';
  const showSoftwareFields = values.expenseType === 'Software';

  function set<K extends keyof RequestValues>(key: K, val: RequestValues[K]): void {
    setValues(prev => ({ ...prev, [key]: val }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[key];

      return next;
    });
  }

  async function handleSave(): Promise<void> {
    setBusy(true);

    try {
      const saved = await onSave(values);

      showToast('Draft saved.', 'success');

      if (mode === 'create') {
        void navigate(`/${saved.id}`);
      }
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(): Promise<void> {
    const clientErrors = validateRequestValues(values);

    if (hasErrors(clientErrors)) {
      setErrors(clientErrors);

      return;
    }

    setBusy(true);

    try {
      let id = requestId;

      if (!id) {
        const saved = await onSave(values);
        id = saved.id;
      }

      await onSubmit(id);

      showToast('Request submitted for approval.', 'success');
      void navigate(`/${id}`);
    } catch (err) {
      if (err instanceof ApiRequestError && err.fields) {
        setErrors(err.fields);
      } else {
        showToast((err as Error).message, 'error');
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (hasErrors(errors) && firstErrorRef.current) {
      firstErrorRef.current.focus();
    }
  }, [errors]);

  return (
    <form
      className="request-form"
      noValidate
      onSubmit={e => {
        e.preventDefault();
        void handleSubmit();
      }}
    >
      <div className="request-form__field">
        <SelectField
          id="expenseType"
          label="Expense Type"
          value={values.expenseType ?? ''}
          onChange={v => set('expenseType', v as RequestValues['expenseType'])}
          options={EXPENSE_TYPE_OPTIONS}
          error={errors['expenseType']}
          hint="Choose a category for this expense"
          required
        />
      </div>

      <div className="request-form__field">
        <MoneyField
          id="amountCents"
          label="Amount"
          valueCents={values.amountCents}
          onChange={v => set('amountCents', v)}
          error={errors['amountCents']}
          hint="Enter the total expense amount"
          required
        />
      </div>

      <div className="request-form__field">
        <TextAreaField
          id="description"
          label="Description"
          value={values.description ?? ''}
          onChange={v => set('description', v)}
          error={errors['description']}
          required
          hint="Briefly describe what this expense is for"
          placeholder="What is this expense for?"
        />
      </div>

      <div className="request-form__field">
        <CheckboxField
          id="billable"
          label="Bill to client"
          checked={values.billable ?? false}
          onChange={v => set('billable', v)}
        />
      </div>

      {showClient && (
        <div className="request-form__field">
          <SelectField
            id="client"
            label={
              (
                <>
                  Client{' '}
                  <WhyRequired reason="Required because this expense will be billed to a client." />
                </>
              ) as unknown as string
            }
            value={values.client ?? ''}
            onChange={v => set('client', v)}
            options={CLIENT_OPTIONS}
            error={errors['client']}
            hint="Select the client to bill for this expense"
            required
          />
        </div>
      )}

      {showJustification && (
        <div className="request-form__field">
          <TextAreaField
            id="additionalJustification"
            label="Additional Justification"
            value={values.additionalJustification ?? ''}
            onChange={v => set('additionalJustification', v)}
            error={errors['additionalJustification']}
            required
            hint="Required for expenses over $1,000."
            placeholder="Explain why this large expense is necessary"
          />
        </div>
      )}

      {showOtherReason && (
        <div className="request-form__field">
          <TextAreaField
            id="otherReason"
            label="Reason for Other"
            value={values.otherReason ?? ''}
            onChange={v => set('otherReason', v)}
            error={errors['otherReason']}
            required
            hint="Describe what kind of expense this is"
            placeholder="Describe the expense type"
          />
        </div>
      )}

      {showTravelFields && (
        <>
          <div className="request-form__field">
            <TextField
              id="destination"
              label="Destination"
              value={values.destination ?? ''}
              onChange={v => set('destination', v)}
              error={errors['destination']}
              placeholder="City, State / Country"
            />
          </div>
          <div className="request-form__field request-form__field--row">
            <TextField
              id="travelStartDate"
              label="Travel Start Date"
              value={values.travelStartDate ?? ''}
              onChange={v => set('travelStartDate', v)}
              error={errors['travelStartDate']}
              placeholder="YYYY-MM-DD"
            />
            <TextField
              id="travelEndDate"
              label="Travel End Date"
              value={values.travelEndDate ?? ''}
              onChange={v => set('travelEndDate', v)}
              error={errors['travelEndDate']}
              placeholder="YYYY-MM-DD"
            />
          </div>
        </>
      )}

      {showSoftwareFields && (
        <>
          <div className="request-form__field">
            <TextField
              id="vendor"
              label="Vendor / Product"
              value={values.vendor ?? ''}
              onChange={v => set('vendor', v)}
              error={errors['vendor']}
              placeholder="e.g. Figma, GitHub Copilot"
            />
          </div>
          <div className="request-form__field">
            <TextAreaField
              id="vendorReason"
              label="Reason for This Tool"
              value={values.vendorReason ?? ''}
              onChange={v => set('vendorReason', v)}
              error={errors['vendorReason']}
              placeholder="Explain how this tool will be used"
            />
          </div>
        </>
      )}

      <div className="request-form__actions">
        <Button type="button" variant="secondary" onClick={() => void handleSave()} disabled={busy}>
          Save Draft
        </Button>
        <Button type="submit" variant="primary" disabled={busy || !isValid}>
          Submit for Approval
        </Button>
      </div>

      {hasErrors(errors) && (
        <p
          ref={el => {
            firstErrorRef.current = el;
          }}
          className="request-form__error-summary"
          role="alert"
          tabIndex={-1}
        >
          Please fix the errors above before submitting.
        </p>
      )}
    </form>
  );
}
