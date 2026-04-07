import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from '../entities/contact-message.entity';
import { ConsultancyRequest } from '../entities/consultancy-request.entity';
import { ConsultationConflictStatus, TicketStatus } from '../entities/enums';
import { EmailDeliveryService } from './email-delivery.service';

@Injectable()
export class AdminInboxService {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly contactMessageRepository: Repository<ContactMessage>,
    @InjectRepository(ConsultancyRequest)
    private readonly consultancyRequestRepository: Repository<ConsultancyRequest>,
    private readonly emailDeliveryService: EmailDeliveryService,
  ) {}

  async getInboxSummary() {
    const [contactMessages, consultancyRequests] = await Promise.all([
      this.contactMessageRepository.find({ order: { createdAt: 'DESC' } }),
      this.consultancyRequestRepository.find({ order: { createdAt: 'DESC' } }),
    ]);

    return {
      contactMessages: contactMessages.map((item) => ({
        ...item,
        urgencyLevel: this.resolveContactUrgency(item),
        urgencyLabel: this.resolveContactUrgencyLabel(item),
        category: 'contact',
      })),
      consultancyRequests: consultancyRequests.map((item) => ({
        ...item,
        urgencyLevel: this.resolveConsultancyUrgency(item.conflictStatus),
        urgencyLabel: this.resolveConsultancyUrgencyLabel(item.conflictStatus),
        category: 'consultancy',
      })),
      stats: {
        contactsOpen: contactMessages.filter((item) => item.status === TicketStatus.NOVO).length,
        consultancyOpen: consultancyRequests.filter((item) => item.status === TicketStatus.NOVO).length,
        urgentCases: consultancyRequests.filter((item) =>
          [ConsultationConflictStatus.INVADIDA_TOTAL, ConsultationConflictStatus.INVADIDA_PARCIAL].includes(item.conflictStatus),
        ).length,
        awaitingResponse:
          contactMessages.filter((item) => item.status !== TicketStatus.RESPONDIDO && item.status !== TicketStatus.ENCERRADO).length +
          consultancyRequests.filter((item) => item.status !== TicketStatus.RESPONDIDO && item.status !== TicketStatus.ENCERRADO).length,
      },
    };
  }

  async replyToContactMessage(id: string, request: { subject?: string; message: string; status?: TicketStatus }) {
    const contact = await this.contactMessageRepository.findOne({ where: { id } });
    if (!contact) {
      throw new Error('Mensagem de contato nao encontrada.');
    }

    await this.emailDeliveryService.send(
      contact.email,
      request.subject?.trim() || `Resposta do Instituto Amarte: ${contact.subject}`,
      request.message.trim(),
    );

    contact.status = request.status || TicketStatus.RESPONDIDO;
    return this.contactMessageRepository.save(contact);
  }

  async replyToConsultancyRequest(id: string, request: { subject?: string; message: string; status?: TicketStatus }) {
    const consultancy = await this.consultancyRequestRepository.findOne({ where: { id } });
    if (!consultancy) {
      throw new Error('Solicitacao de consultoria nao encontrada.');
    }

    await this.emailDeliveryService.send(
      consultancy.requesterEmail,
      request.subject?.trim() || `Resposta do Instituto Amarte: ${consultancy.farmName}`,
      request.message.trim(),
    );

    consultancy.status = request.status || TicketStatus.RESPONDIDO;
    return this.consultancyRequestRepository.save(consultancy);
  }

  async updateContactStatus(id: string, status: TicketStatus) {
    const contact = await this.contactMessageRepository.findOne({ where: { id } });
    if (!contact) {
      throw new Error('Mensagem de contato nao encontrada.');
    }
    contact.status = status;
    return this.contactMessageRepository.save(contact);
  }

  async updateConsultancyStatus(id: string, status: TicketStatus) {
    const consultancy = await this.consultancyRequestRepository.findOne({ where: { id } });
    if (!consultancy) {
      throw new Error('Solicitacao de consultoria nao encontrada.');
    }
    consultancy.status = status;
    return this.consultancyRequestRepository.save(consultancy);
  }

  private resolveConsultancyUrgency(conflictStatus: ConsultationConflictStatus): 'critical' | 'high' | 'medium' | 'low' {
    switch (conflictStatus) {
      case ConsultationConflictStatus.INVADIDA_TOTAL:
        return 'critical';
      case ConsultationConflictStatus.INVADIDA_PARCIAL:
        return 'high';
      case ConsultationConflictStatus.AMEACA:
        return 'medium';
      case ConsultationConflictStatus.PROCESSO:
        return 'low';
      default:
        return 'low';
    }
  }

  private resolveConsultancyUrgencyLabel(conflictStatus: ConsultationConflictStatus): string {
    switch (this.resolveConsultancyUrgency(conflictStatus)) {
      case 'critical':
        return 'Ataque em andamento';
      case 'high':
        return 'Invasao parcial';
      case 'medium':
        return 'Ameaca de invasao';
      default:
        return 'Acompanhamento juridico';
    }
  }

  private resolveContactUrgency(item: ContactMessage): 'critical' | 'high' | 'medium' | 'low' {
    const haystack = `${item.subject || ''} ${item.message || ''}`.toLowerCase();
    if (haystack.includes('ataque') || haystack.includes('invad')) {
      return 'high';
    }
    if (haystack.includes('amea') || haystack.includes('urg')) {
      return 'medium';
    }
    return 'low';
  }

  private resolveContactUrgencyLabel(item: ContactMessage): string {
    switch (this.resolveContactUrgency(item)) {
      case 'high':
        return 'Prioridade alta';
      case 'medium':
        return 'Revisao rapida';
      default:
        return 'Contato geral';
    }
  }
}
