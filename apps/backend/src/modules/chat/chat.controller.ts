import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import type {
  ChatMessage,
  ChatThreadDetail,
  ChatThreadSummary,
} from '@kasahouse/shared-types';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { ChatService } from './chat.service';
import {
  ListMessagesQueryDto,
  SendMessageDto,
  StartChatDto,
} from './dto/chat.dto';

@Controller('chat/threads')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  listThreads(@CurrentUser('id') userId: string): Promise<ChatThreadSummary[]> {
    return this.chat.listThreads(userId);
  }

  @Post()
  start(
    @CurrentUser('id') userId: string,
    @Body() dto: StartChatDto,
  ): Promise<ChatThreadDetail> {
    return this.chat.startThread(userId, dto.listingId);
  }

  @Get(':id')
  getThread(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query() query: ListMessagesQueryDto,
  ): Promise<ChatThreadDetail> {
    return this.chat.getThread(userId, id, query);
  }

  @Post(':id/messages')
  send(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ): Promise<ChatMessage> {
    return this.chat.sendMessage(userId, id, dto.content);
  }

  @Post(':id/read')
  markRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<{ updated: number }> {
    return this.chat.markRead(userId, id);
  }
}
