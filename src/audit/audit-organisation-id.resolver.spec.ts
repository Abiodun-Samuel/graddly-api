import { Invitation } from '../invitations/entities/invitation.entity.js';
import { OrganisationMembership } from '../organisations/entities/organisation-membership.entity.js';
import { Organisation } from '../organisations/entities/organisation.entity.js';
import { OrganisationRole } from '../organisations/organisation-role.enum.js';
import { OtjLogEntry } from '../otj/entities/otj-log-entry.entity.js';
import { ReviewRecord } from '../reviews/entities/review-record.entity.js';
import { ReviewSignature } from '../reviews/entities/review-signature.entity.js';
import { Review } from '../reviews/entities/review.entity.js';
import { WithdrawalCompletionPush } from '../withdrawal-push/entities/withdrawal-completion-push.entity.js';

import {
  isAuditedEntity,
  resolveAuditOrganisationId,
} from './audit-organisation-id.resolver.js';

describe('audit-organisation-id.resolver', () => {
  it('resolves organisation id for organisations', () => {
    const org = Object.assign(new Organisation(), { id: 'org-1' });
    expect(resolveAuditOrganisationId(org, 'organisations')).toBe('org-1');
  });

  it('resolves organisation id for invitations', () => {
    const invitation = Object.assign(new Invitation(), {
      organisationId: 'org-2',
    });
    expect(resolveAuditOrganisationId(invitation, 'invitations')).toBe('org-2');
  });

  it('resolves organisation id for memberships via relation', () => {
    const membership = Object.assign(new OrganisationMembership(), {
      organisation: { id: 'org-3' },
      role: OrganisationRole.MEMBER,
    });
    expect(
      resolveAuditOrganisationId(membership, 'organisation_memberships'),
    ).toBe('org-3');
  });

  it('resolves organisation id for otj log entries', () => {
    const entry = Object.assign(new OtjLogEntry(), {
      organisationId: 'org-otj',
    });
    expect(resolveAuditOrganisationId(entry, 'otj_log_entries')).toBe(
      'org-otj',
    );
  });

  it('resolves organisation id for reviews', () => {
    const review = Object.assign(new Review(), { organisationId: 'org-rev' });
    expect(resolveAuditOrganisationId(review, 'reviews')).toBe('org-rev');
  });

  it('resolves organisation id for review records', () => {
    const record = Object.assign(new ReviewRecord(), {
      organisationId: 'org-rec',
    });
    expect(resolveAuditOrganisationId(record, 'review_records')).toBe(
      'org-rec',
    );
  });

  it('resolves organisation id for review signatures', () => {
    const sig = Object.assign(new ReviewSignature(), {
      organisationId: 'org-sig',
    });
    expect(resolveAuditOrganisationId(sig, 'review_signatures')).toBe(
      'org-sig',
    );
  });

  it('resolves organisation id for withdrawal completion pushes', () => {
    const push = Object.assign(new WithdrawalCompletionPush(), {
      organisationId: 'org-push',
    });
    expect(
      resolveAuditOrganisationId(push, 'withdrawal_completion_pushes'),
    ).toBe('org-push');
  });

  it('isAuditedEntity returns true only for audited classes', () => {
    expect(isAuditedEntity(new Organisation())).toBe(true);
    expect(isAuditedEntity(new Invitation())).toBe(true);
    expect(isAuditedEntity(new OtjLogEntry())).toBe(true);
    expect(isAuditedEntity(new Review())).toBe(true);
    expect(isAuditedEntity(new ReviewRecord())).toBe(true);
    expect(isAuditedEntity(new ReviewSignature())).toBe(true);
    expect(isAuditedEntity(new WithdrawalCompletionPush())).toBe(true);
    expect(isAuditedEntity({ id: 'x' })).toBe(false);
  });
});
