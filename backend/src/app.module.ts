import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { getDatabaseConfig } from './config/database';
import { AppUser } from './entities/app-user.entity';
import { AuthSession } from './entities/auth-session.entity';
import { ConsultancyRequest } from './entities/consultancy-request.entity';
import { ContactMessage } from './entities/contact-message.entity';
import { Donation } from './entities/donation.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { MarketAsset } from './entities/market-asset.entity';
import { MarketQuote } from './entities/market-quote.entity';
import { MembershipPlan } from './entities/membership-plan.entity';
import { NewsArticle } from './entities/news-article.entity';
import { NewsletterSubscriber } from './entities/newsletter-subscriber.entity';
import { ProductCatalog } from './entities/product-catalog.entity';
import { ServiceCatalog } from './entities/service-catalog.entity';
import { UserAddress } from './entities/user-address.entity';
import { UserMarketWatchlist } from './entities/user-market-watchlist.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { VideoItem } from './entities/video-item.entity';
import { AppUserController } from './controllers/app-user.controller';
import { AuthSessionController } from './controllers/auth-session.controller';
import { EmailVerificationController } from './controllers/email-verification.controller';
import { ConsultancyRequestController } from './controllers/consultancy-request.controller';
import { ContactMessageController } from './controllers/contact-message.controller';
import { DonationController } from './controllers/donation.controller';
import { MarketAssetController } from './controllers/market-asset.controller';
import { MarketQuoteController } from './controllers/market-quote.controller';
import { MembershipPlanController } from './controllers/membership-plan.controller';
import { NewsArticleController } from './controllers/news-article.controller';
import { NewsletterSubscriberController } from './controllers/newsletter-subscriber.controller';
import { ProductCatalogController } from './controllers/product-catalog.controller';
import { ServiceCatalogController } from './controllers/service-catalog.controller';
import { UserAddressController } from './controllers/user-address.controller';
import { UserMarketWatchlistController } from './controllers/user-market-watchlist.controller';
import { UserSubscriptionController } from './controllers/user-subscription.controller';
import { VideoItemController } from './controllers/video-item.controller';
import { AppUserService } from './services/app-user.service';
import { AuthSessionService } from './services/auth-session.service';
import { EmailVerificationService } from './services/email-verification.service';
import { EmailDeliveryService } from './services/email-delivery.service';
import { EmailValidationService } from './services/email-validation.service';
import { DisposableEmailDomainService } from './services/disposable-email-domain.service';
import { PasswordService } from './services/password.service';
import { LoginAttemptService } from './services/login-attempt.service';
import { ConsultancyRequestService } from './services/consultancy-request.service';
import { ContactMessageService } from './services/contact-message.service';
import { DonationService } from './services/donation.service';
import { MarketAssetService } from './services/market-asset.service';
import { MarketQuoteService } from './services/market-quote.service';
import { MembershipPlanService } from './services/membership-plan.service';
import { NewsArticleService } from './services/news-article.service';
import { NewsletterSubscriberService } from './services/newsletter-subscriber.service';
import { ProductCatalogService } from './services/product-catalog.service';
import { ServiceCatalogService } from './services/service-catalog.service';
import { UserAddressService } from './services/user-address.service';
import { UserMarketWatchlistService } from './services/user-market-watchlist.service';
import { UserSubscriptionService } from './services/user-subscription.service';
import { VideoItemService } from './services/video-item.service';
import { PublicApiRateLimitMiddleware } from './middleware/public-api-rate-limit.middleware';
import { ApiCsrfProtectionMiddleware } from './middleware/api-csrf-protection.middleware';
import { ApiSessionAuthMiddleware } from './middleware/api-session-auth.middleware';
import { ApiSecurityHeadersMiddleware } from './middleware/api-security-headers.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      ...getDatabaseConfig(),
      // FIX: Forçando SSL para o Supabase em produção (Vercel)
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      extra: {
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      },
      entities: [
        AppUser,
        AuthSession,
        ConsultancyRequest,
        ContactMessage,
        Donation,
        EmailVerificationToken,
        MarketAsset,
        MarketQuote,
        MembershipPlan,
        NewsArticle,
        NewsletterSubscriber,
        ProductCatalog,
        ServiceCatalog,
        UserAddress,
        UserMarketWatchlist,
        UserSubscription,
        VideoItem,
      ],
    }),
    TypeOrmModule.forFeature([
      AppUser,
      AuthSession,
      ConsultancyRequest,
      ContactMessage,
      Donation,
      EmailVerificationToken,
      MarketAsset,
      MarketQuote,
      MembershipPlan,
      NewsArticle,
      NewsletterSubscriber,
      ProductCatalog,
      ServiceCatalog,
      UserAddress,
      UserMarketWatchlist,
      UserSubscription,
      VideoItem,
    ]),
  ],
  controllers: [
    AppUserController,
    AuthSessionController,
    EmailVerificationController,
    ConsultancyRequestController,
    ContactMessageController,
    DonationController,
    MarketAssetController,
    MarketQuoteController,
    MembershipPlanController,
    NewsArticleController,
    NewsletterSubscriberController,
    ProductCatalogController,
    ServiceCatalogController,
    UserAddressController,
    UserMarketWatchlistController,
    UserSubscriptionController,
    VideoItemController,
  ],
  providers: [
    AppUserService,
    AuthSessionService,
    EmailVerificationService,
    EmailDeliveryService,
    EmailValidationService,
    DisposableEmailDomainService,
    PasswordService,
    LoginAttemptService,
    ConsultancyRequestService,
    ContactMessageService,
    DonationService,
    MarketAssetService,
    MarketQuoteService,
    MembershipPlanService,
    NewsArticleService,
    NewsletterSubscriberService,
    ProductCatalogService,
    ServiceCatalogService,
    UserAddressService,
    UserMarketWatchlistService,
    UserSubscriptionService,
    VideoItemService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        PublicApiRateLimitMiddleware,
        ApiCsrfProtectionMiddleware,
        ApiSessionAuthMiddleware,
        ApiSecurityHeadersMiddleware,
      )
      .forRoutes('*');
  }
}