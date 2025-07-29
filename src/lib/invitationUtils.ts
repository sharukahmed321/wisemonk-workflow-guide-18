
// Invitation management utilities for frontend simulation
import { v4 as uuidv4 } from 'uuid';

export interface InvitationData {
  id: string;
  token: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'expired';
}

const INVITATIONS_STORAGE_KEY = 'wisemonk_invitations';

export function createInvitation(employeeData: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
}): InvitationData {
  const invitation: InvitationData = {
    id: uuidv4(),
    token: uuidv4(),
    employeeId: employeeData.id,
    email: employeeData.email,
    firstName: employeeData.firstName,
    lastName: employeeData.lastName,
    jobTitle: employeeData.jobTitle,
    department: employeeData.department,
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  // Store invitation
  const invitations = getInvitations();
  invitations.push(invitation);
  localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(invitations));

  // Simulate email sending
  console.log('📧 Email sent to:', employeeData.email);
  console.log('🔗 Invitation link: /invite/' + invitation.token);

  return invitation;
}

export function getInvitations(): InvitationData[] {
  try {
    const stored = localStorage.getItem(INVITATIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading invitations:', error);
    return [];
  }
}

export function getInvitationByToken(token: string): InvitationData | null {
  const invitations = getInvitations();
  return invitations.find(inv => inv.token === token) || null;
}

export function acceptInvitation(token: string): InvitationData | null {
  const invitations = getInvitations();
  const invitation = invitations.find(inv => inv.token === token);
  
  if (invitation) {
    invitation.status = 'accepted';
    localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(invitations));
    return invitation;
  }
  
  return null;
}

export function simulateEmailSending(email: string, firstName: string, token: string) {
  // Simulate email sending with realistic delay
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      console.log(`
📧 MOCK EMAIL SENT
To: ${email}
Subject: Welcome to the team, ${firstName}! Complete your preboarding

Hi ${firstName},

Welcome to our team! We're excited to have you join us.

To complete your onboarding process, please click the link below:
${window.location.origin}/invite/${token}

This link will expire in 7 days.

Best regards,
HR Team
      `);
      resolve();
    }, 1000);
  });
}
