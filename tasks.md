# Implementation Plan: ZeroClick Autonomous Content Agent

## Overview

This implementation plan breaks down the ZeroClick platform into discrete, incremental coding tasks. The approach follows a **bottom-up architecture** starting with core data models and utilities, then building individual Lambda functions, and finally wiring everything together with event-driven orchestration. Each task builds on previous work to ensure no orphaned code.

The implementation uses **Python 3.12** with AWS Lambda (ARM64 Graviton2) and follows serverless best practices for cost efficiency and scalability.

## Tasks

- [ ] 1. Set up project structure and core infrastructure
  - Create Python project with virtual environment (Python 3.12)
  - Set up AWS CDK or Terraform for infrastructure as code
  - Configure DynamoDB tables (user_config, trends, drafts, engagement_history, notification_log)
  - Configure OpenSearch Serverless index (style_vectors)
  - Set up S3 bucket structure for Knowledge Base
  - Configure AWS Secrets Manager for API credentials
  - Set up CloudWatch log groups and X-Ray tracing
  - _Requirements: 9.1, 9.4, 9.6, 12.1, 12.3_

- [ ] 2. Implement core data models and validation
  - [ ] 2.1 Create DynamoDB data model classes
    - Implement UserConfig model with validation (scan time, platforms, keywords, channels, quiet hours)
    - Implement Trend model with metadata (platform, content, scores, metrics, TTL)
    - Implement Draft model with status tracking (pending, approved, rejected, published)
    - Implement EngagementHistory model with metrics tracking
    - Implement NotificationLog model with delivery status
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 2.2 Write property test for configuration validation round-trip
    - **Property 40: Configuration Validation and Persistence Round-Trip**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

  - [ ] 2.3 Create OpenSearch vector model classes
    - Implement StyleVector model with 1536-dim embedding
    - Implement style_metadata structure (sentence length, emoji frequency, formality, tone)
    - Add vector similarity search methods using cosine similarity
    - _Requirements: 7.5, 7.7, 2.1_

  - [ ]* 2.4 Write property test for embedding dimensionality
    - **Property 39: Embedding Dimensionality**
    - **Validates: Requirements 7.5**

- [ ] 3. Implement AWS service client wrappers
  - [ ] 3.1 Create DynamoDB client wrapper
    - Implement CRUD operations with error handling
    - Add batch operations for bulk reads/writes
    - Implement TTL management for trend caching
    - Add exponential backoff retry logic for throttling
    - _Requirements: 9.4, 11.3_

  - [ ] 3.2 Create OpenSearch client wrapper
    - Implement vector indexing with bulk operations
    - Add k-NN similarity search with engagement filtering
    - Implement weight update operations for viral learning
    - Add error handling for indexing failures
    - _Requirements: 9.6, 2.1, 6.3, 6.4_

  - [ ] 3.3 Create Bedrock client wrapper
    - Implement Converse API calls for Claude 3.5 Sonnet
    - Add Titan Embeddings API calls for vector generation
    - Implement rate limiting (30 calls/day per user)
    - Add retry logic for throttling exceptions
    - _Requirements: 2.4, 7.5, 11.1_

  - [ ]* 3.4 Write property test for Bedrock rate limiting
    - **Property 45: Bedrock API Rate Limiting**
    - **Validates: Requirements 11.1**

  - [ ] 3.5 Create S3 client wrapper
    - Implement upload/download for Knowledge Base documents
    - Add Intelligent-Tiering configuration
    - Implement batch operations for bulk uploads
    - _Requirements: 9.5, 7.1_

  - [ ] 3.6 Create Secrets Manager client wrapper
    - Implement secure credential retrieval for platform APIs
    - Add caching to minimize API calls
    - _Requirements: 12.3_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Trend Scanner Lambda function
  - [ ] 5.1 Create external API clients
    - Implement LinkedIn API v2 client with OAuth 2.0
    - Implement X API v2 client with Bearer Token
    - Implement Reddit API client with OAuth 2.0
    - Add error handling with exponential backoff
    - _Requirements: 1.2, 12.6_

  - [ ] 5.2 Implement semantic similarity filtering
    - Create embedding generation for trends and keywords
    - Implement cosine similarity calculation
    - Add threshold-based filtering (similarity > 0.7)
    - _Requirements: 1.3_

  - [ ]* 5.3 Write property test for semantic trend filtering
    - **Property 3: Semantic Trend Filtering**
    - **Validates: Requirements 1.3**

  - [ ] 5.4 Implement composite score ranking
    - Calculate recency score from timestamp
    - Calculate engagement velocity from metrics
    - Implement weighted composite formula (0.4×recency + 0.3×velocity + 0.3×keyword_match)
    - Sort trends by composite score descending
    - _Requirements: 1.4_

  - [ ]* 5.5 Write property test for composite score ranking
    - **Property 4: Composite Score Ranking**
    - **Validates: Requirements 1.4**

  - [ ] 5.6 Implement emerging trend detection
    - Fetch 7-day historical baseline from DynamoDB
    - Compare current engagement velocity to baseline
    - Flag trends with >50% velocity increase as emerging
    - _Requirements: 1.6_

  - [ ] 5.7 Wire Trend Scanner Lambda handler
    - Implement parallel API calls using asyncio.gather
    - Store filtered and ranked trends in DynamoDB with TTL
    - Add CloudWatch logging and X-Ray tracing
    - _Requirements: 1.2, 1.5_

  - [ ]* 5.8 Write property test for trend metadata persistence
    - **Property 5: Trend Metadata Persistence**
    - **Validates: Requirements 1.5**

- [ ] 6. Implement RAG Pipeline and Style Vector generation
  - [ ] 6.1 Create style feature extraction module
    - Calculate avg_sentence_length from text
    - Calculate emoji_frequency using regex
    - Calculate formality_score using linguistic features
    - Detect tone (conversational, professional, casual)
    - Extract common_phrases using n-gram analysis
    - Extract hashtag_pattern using regex
    - _Requirements: 2.7_

  - [ ]* 6.2 Write property test for style feature extraction
    - **Property 11: Style Feature Extraction**
    - **Validates: Requirements 2.7**

  - [ ] 6.3 Implement Style Vector generation
    - Aggregate embeddings from historical posts using TF-IDF
    - Generate 1536-dim vector using Titan Embeddings
    - Store in OpenSearch with style_metadata
    - Enforce minimum 5 posts threshold before generation
    - _Requirements: 7.4, 7.5_

  - [ ]* 6.4 Write property test for initial Style Vector generation threshold
    - **Property 38: Initial Style Vector Generation Threshold**
    - **Validates: Requirements 7.4**

  - [ ] 6.5 Implement engagement-aware retrieval
    - Query OpenSearch with engagement_percentile >= 75 filter
    - Retrieve top-k patterns sorted by weight descending
    - Return style patterns with metadata
    - _Requirements: 2.1, 2.6_

  - [ ]* 6.6 Write property test for Style Vector retrieval
    - **Property 7: Style Vector Retrieval**
    - **Validates: Requirements 2.1, 2.6**

  - [ ] 6.7 Implement RAG prompt construction
    - Format style patterns into prompt context
    - Inject top-k patterns into generation prompt
    - Add platform-specific constraints (character limits)
    - _Requirements: 2.2_

  - [ ]* 6.8 Write property test for RAG prompt injection
    - **Property 8: RAG Prompt Injection**
    - **Validates: Requirements 2.2**

- [ ] 7. Implement Draft Generator Lambda function
  - [ ] 7.1 Create draft generation logic
    - Retrieve Style Vector using RAG pipeline
    - Construct generation prompt with style injection
    - Generate 3 variations using temperature sampling (0.7, 0.85, 1.0)
    - Validate character limits per platform (LinkedIn: 3000, X: 280, Reddit: 40000)
    - Store drafts in DynamoDB with metadata
    - _Requirements: 2.3, 2.5_

  - [ ]* 7.2 Write property test for draft generation constraints
    - **Property 9: Draft Generation Constraints**
    - **Validates: Requirements 2.3, 2.5**

  - [ ] 7.3 Implement Bedrock Converse API integration
    - Call Claude 3.5 Sonnet with constructed prompt
    - Handle throttling and timeout exceptions
    - Parse and validate model response
    - _Requirements: 2.4_

  - [ ]* 7.4 Write property test for Bedrock API integration
    - **Property 10: Bedrock API Integration**
    - **Validates: Requirements 2.4**

  - [ ] 7.5 Wire Draft Generator Lambda handler
    - Accept trend_id and user_id as input
    - Orchestrate RAG retrieval and generation
    - Store 3 draft variations in DynamoDB
    - Trigger Nudge Service Lambda
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement Nudge Service Lambda function
  - [ ] 9.1 Create notification channel clients
    - Implement WhatsApp Business API client
    - Implement Telegram Bot API client
    - Add retry logic with exponential backoff (1min, 5min, 15min)
    - _Requirements: 3.1, 3.4_

  - [ ]* 9.2 Write property test for exponential backoff retry
    - **Property 15: Exponential Backoff Retry**
    - **Validates: Requirements 3.4**

  - [ ] 9.3 Implement notification content generation
    - Extract first 100 characters as preview snippet
    - Generate deep link URL with user_id and draft_id parameters
    - Format notification message with preview and link
    - _Requirements: 3.2_

  - [ ]* 9.4 Write property test for notification content completeness
    - **Property 13: Notification Content Completeness**
    - **Validates: Requirements 3.2**

  - [ ] 9.5 Implement quiet hours logic
    - Parse user's quiet hours configuration with timezone
    - Check if current time falls within quiet hours
    - Reschedule notification to next available time if needed
    - _Requirements: 3.3_

  - [ ]* 9.6 Write property test for quiet hours respect
    - **Property 14: Quiet Hours Respect**
    - **Validates: Requirements 3.3**

  - [ ] 9.7 Implement rate limiting
    - Query notification_log for user's notifications in last 24 hours
    - Reject if count >= 3 with rate limit error
    - _Requirements: 3.6_

  - [ ]* 9.8 Write property test for notification rate limiting
    - **Property 17: Notification Rate Limiting**
    - **Validates: Requirements 3.6**

  - [ ] 9.9 Wire Nudge Service Lambda handler
    - Send notifications to all configured channels
    - Log all attempts with delivery status to DynamoDB
    - Handle failures with retry logic
    - _Requirements: 3.1, 3.5_

  - [ ]* 9.10 Write property test for notification logging completeness
    - **Property 16: Notification Logging Completeness**
    - **Validates: Requirements 3.5**

- [ ] 10. Implement Voice Processor Lambda function
  - [ ] 10.1 Create Amazon Transcribe integration
    - Start transcription job with automatic language detection
    - Support audio formats: MP3, WAV, M4A, OGG
    - Validate audio duration <= 5 minutes
    - Wait for transcription completion and fetch result
    - _Requirements: 4.1, 4.4_

  - [ ]* 10.2 Write property test for audio format validation
    - **Property 21: Audio Format Validation**
    - **Validates: Requirements 4.4**

  - [ ] 10.3 Implement custom vocabulary for code-mixing
    - Create custom vocabulary models for Hinglish, Spanglish, Franglais
    - Configure Transcribe to use custom vocabularies
    - Preserve language switches in transcript with tags
    - _Requirements: 4.5, 10.3, 10.6_

  - [ ]* 10.4 Write property test for code-mixing preservation
    - **Property 22: Code-Mixing Preservation**
    - **Validates: Requirements 4.5, 10.3, 10.6**

  - [ ] 10.5 Implement intent classification
    - Use Claude to classify transcript intent (EDIT_INSTRUCTION, NEW_STORY, UNKNOWN)
    - Extract editing operations from EDIT_INSTRUCTION intents
    - Extract narrative elements from NEW_STORY intents
    - _Requirements: 4.2_

  - [ ]* 10.6 Write property test for voice intent classification
    - **Property 19: Voice Intent Classification**
    - **Validates: Requirements 4.2**

  - [ ] 10.7 Implement vernacular instruction parsing
    - Convert casual instructions to structured editing parameters
    - Map vernacular phrases to formality/humor/tone adjustments
    - Generate structured edit operations JSON
    - _Requirements: 4.7_

  - [ ]* 10.8 Write property test for vernacular instruction parsing
    - **Property 24: Vernacular Instruction Parsing**
    - **Validates: Requirements 4.7**

  - [ ] 10.9 Implement draft edit application
    - Fetch target draft from DynamoDB
    - Apply structured edits using Claude
    - Validate updated draft against platform limits
    - Store updated draft in DynamoDB
    - _Requirements: 4.3_

  - [ ] 10.10 Implement session context management
    - Store conversation history in DynamoDB with session_id
    - Retrieve context for subsequent voice notes in same session
    - Maintain context across multiple voice inputs
    - _Requirements: 4.6_

  - [ ]* 10.11 Write property test for session context persistence
    - **Property 23: Session Context Persistence**
    - **Validates: Requirements 4.6**

  - [ ] 10.12 Wire Voice Processor Lambda handler
    - Accept audio file from S3 or direct upload
    - Orchestrate transcription, intent classification, and edit application
    - Return updated draft or new content
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement Engagement Monitor Lambda function
  - [ ] 12.1 Create platform metrics fetching
    - Implement LinkedIn metrics API client (likes, comments, shares, views)
    - Implement X metrics API client
    - Implement Reddit metrics API client
    - Add error handling for API failures
    - _Requirements: 6.1_

  - [ ] 12.2 Implement composite engagement score calculation
    - Fetch follower count for normalization
    - Calculate weighted score: (0.4×likes + 0.3×comments + 0.2×shares + 0.1×views) / follower_count
    - Calculate engagement percentile against user's historical posts
    - _Requirements: 6.2_

  - [ ]* 12.3 Write property test for composite engagement score calculation
    - **Property 31: Composite Engagement Score Calculation**
    - **Validates: Requirements 6.2**

  - [ ] 12.4 Implement viral filter weight updates
    - Update OpenSearch weight to 1.2 for percentile >= 75
    - Update OpenSearch weight to 0.7 for percentile <= 25
    - Use gradient-based updates to prevent catastrophic forgetting
    - Enforce minimum 10 posts threshold before adjustments
    - _Requirements: 6.3, 6.4, 6.6, 6.7_

  - [ ]* 12.5 Write property test for engagement-based weight adjustment
    - **Property 32: Engagement-Based Weight Adjustment**
    - **Validates: Requirements 6.3, 6.4**

  - [ ]* 12.6 Write property test for statistical significance threshold
    - **Property 33: Statistical Significance Threshold**
    - **Validates: Requirements 6.6**

  - [ ] 12.7 Wire Engagement Monitor Lambda handler
    - Schedule 6-hour polling for 7 days using Step Functions
    - Store engagement data in DynamoDB
    - Update Style Vector weights in OpenSearch
    - _Requirements: 6.1, 6.5_

- [ ] 13. Implement Knowledge Base upload and processing
  - [ ] 13.1 Create bulk upload parser
    - Parse CSV files with schema validation
    - Parse JSON files with schema validation
    - Validate required fields (content, platform, timestamp)
    - Reject invalid uploads with descriptive errors
    - _Requirements: 7.1, 7.2, 7.6_

  - [ ]* 13.2 Write property test for upload schema validation
    - **Property 36: Upload Schema Validation**
    - **Validates: Requirements 7.2, 7.6**

  - [ ] 13.3 Implement embedding generation pipeline
    - Generate embeddings for uploaded posts using Titan
    - Batch process embeddings (batch size >= 5) for efficiency
    - Store embeddings in OpenSearch with metadata
    - Store original posts in S3
    - _Requirements: 7.3, 7.5, 11.8_

  - [ ]* 13.4 Write property test for Knowledge Base storage round-trip
    - **Property 37: Knowledge Base Storage Round-Trip**
    - **Validates: Requirements 7.3, 7.7**

  - [ ]* 13.5 Write property test for batch embedding generation
    - **Property 49: Batch Embedding Generation**
    - **Validates: Requirements 11.8**

  - [ ] 13.6 Wire Knowledge Base upload Lambda handler
    - Accept CSV/JSON file uploads
    - Parse and validate posts
    - Generate embeddings and store in OpenSearch
    - Trigger Style Vector generation after 5+ posts
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 14. Implement Streamlit Choice Dashboard
  - [ ] 14.1 Create dashboard layout
    - Implement user authentication with OAuth 2.0
    - Create main dashboard view with pending drafts
    - Group drafts by trend_id
    - Display 3 variations per trend (viral_hook, value_add, story)
    - _Requirements: 5.1, 5.2_

  - [ ]* 14.2 Write property test for draft grouping by trend
    - **Property 25: Draft Grouping by Trend**
    - **Validates: Requirements 5.1**

  - [ ] 14.3 Implement draft display components
    - Show platform, character count, and content for each draft
    - Add action buttons: approve, edit, reject, voice-refine
    - Sort drafts by trend relevance_score descending
    - _Requirements: 5.3, 5.4, 5.6_

  - [ ]* 14.4 Write property test for draft display completeness
    - **Property 27: Draft Display Completeness**
    - **Validates: Requirements 5.3, 5.4**

  - [ ] 14.5 Implement draft actions
    - Approve: Mark draft as approved, archive other variations
    - Edit: Open inline editor with text modifications
    - Reject: Mark draft as rejected
    - Voice-refine: Upload voice note for editing
    - _Requirements: 5.5_

  - [ ]* 14.6 Write property test for draft selection archival
    - **Property 28: Draft Selection Archival**
    - **Validates: Requirements 5.5**

  - [ ] 14.7 Create configuration management UI
    - Form for daily scan time (00:00-23:59 UTC)
    - Multi-select for target platforms (LinkedIn, X, Reddit)
    - Input for niche keywords (max 10)
    - Multi-select for notification channels (WhatsApp, Telegram)
    - Time range picker for quiet hours
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 14.8 Create usage analytics dashboard
    - Display API call counts
    - Display token consumption
    - Display estimated costs for current billing period
    - Show cost alert if approaching $10/month
    - _Requirements: 11.5, 11.6_

  - [ ]* 14.9 Write property test for usage analytics completeness
    - **Property 48: Usage Analytics Completeness**
    - **Validates: Requirements 11.6**

  - [ ] 14.10 Create Knowledge Base upload UI
    - File uploader for CSV/JSON formats
    - Display upload progress and validation errors
    - Show uploaded posts count and Style Vector status
    - _Requirements: 7.1_

  - [ ] 14.11 Deploy dashboard to AWS App Runner
    - Create Dockerfile for Streamlit app
    - Configure App Runner service with auto-scaling
    - Set up custom domain and HTTPS
    - _Requirements: 9.1_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implement event-driven orchestration
  - [ ] 16.1 Create EventBridge scheduler
    - Create EventBridge rule with user-configured cron expression
    - Target Orchestrator Lambda with workflow context
    - Add error handling for invalid cron expressions
    - _Requirements: 1.1, 9.1_

  - [ ]* 16.2 Write property test for scheduler trigger accuracy
    - **Property 1: Scheduler Trigger Accuracy**
    - **Validates: Requirements 1.1**

  - [ ] 16.3 Create Orchestrator Lambda
    - Fetch all active users from DynamoDB
    - Trigger Trend Scanner for each user in parallel
    - Wait for trend scanning completion
    - Trigger Draft Generator for top 3 trends per user
    - Handle Lambda timeout with async processing
    - _Requirements: 9.3_

  - [ ]* 16.4 Write property test for Lambda execution timeout compliance
    - **Property 41: Lambda Execution Timeout Compliance**
    - **Validates: Requirements 9.3**

  - [ ] 16.4 Create Step Functions workflow for engagement monitoring
    - Define 7-day polling workflow with 6-hour intervals
    - Orchestrate Engagement Monitor Lambda invocations
    - Handle failures with retry logic
    - _Requirements: 6.5, 9.7_

  - [ ] 16.5 Wire all Lambda functions together
    - Orchestrator → Trend Scanner → Draft Generator → Nudge Service
    - Voice Processor → Draft Generator (for edits)
    - Engagement Monitor → Style Vector updates
    - Knowledge Base upload → Style Vector generation
    - _Requirements: All workflow requirements_

- [ ] 17. Implement security and monitoring
  - [ ] 17.1 Configure encryption
    - Enable AWS KMS encryption for DynamoDB tables
    - Enable S3 bucket encryption with KMS
    - Configure TLS 1.3 for all API endpoints
    - _Requirements: 12.1, 12.2_

  - [ ] 17.2 Configure IAM roles
    - Create least-privilege IAM roles for each Lambda function
    - Grant only required permissions (DynamoDB, S3, OpenSearch, Bedrock, Transcribe)
    - Add resource-based policies for cross-service access
    - _Requirements: 12.4_

  - [ ] 17.3 Implement credential management
    - Store platform API credentials in Secrets Manager
    - Implement OAuth 2.0 flows for LinkedIn, X, Reddit
    - Add credential rotation policies
    - Ensure passwords never appear in logs
    - _Requirements: 12.3, 12.5, 12.6_

  - [ ]* 17.4 Write property test for secure credential handling
    - **Property 50: Secure Credential Handling**
    - **Validates: Requirements 12.3, 12.5, 12.6**

  - [ ] 17.5 Configure CloudWatch monitoring
    - Create CloudWatch dashboards for key metrics
    - Set up alarms for error rates > 5%
    - Set up alarms for API failure rates > 10%
    - Configure X-Ray tracing for all Lambda functions
    - _Requirements: Error handling requirements_

  - [ ] 17.6 Implement cost monitoring
    - Track Bedrock API usage per user
    - Calculate estimated costs in real-time
    - Send SNS alert when user exceeds $10/month
    - _Requirements: 11.5_

  - [ ]* 17.7 Write property test for cost alert threshold
    - **Property 47: Cost Alert Threshold**
    - **Validates: Requirements 11.5**

- [ ] 18. Implement caching and optimization
  - [ ] 18.1 Implement trend data caching
    - Store fetched trends in DynamoDB with 24-hour TTL
    - Check cache before making external API calls
    - Return cached data if available and not expired
    - _Requirements: 11.3_

  - [ ]* 18.2 Write property test for trend data caching
    - **Property 46: Trend Data Caching**
    - **Validates: Requirements 11.3**

  - [ ] 18.2 Optimize Lambda cold starts
    - Use Lambda Layers for shared dependencies (boto3, requests, hypothesis)
    - Minimize deployment package size
    - Use ARM64 Graviton2 for 20% cost reduction
    - _Requirements: 9.8, 11.7_

  - [ ] 18.3 Implement connection pooling
    - Reuse DynamoDB connections across Lambda invocations
    - Reuse OpenSearch connections
    - Reuse Bedrock client connections
    - _Requirements: Performance optimization_

- [ ] 19. Final checkpoint - End-to-end testing
  - [ ] 19.1 Run all property tests with 100 iterations
    - Verify all 50 correctness properties pass
    - Check test coverage >= 90% for core logic
    - _Requirements: All requirements_

  - [ ] 19.2 Run integration tests
    - Test complete autonomous workflow (EventBridge → Notification)
    - Test voice refinement workflow (Upload → Transcribe → Edit)
    - Test engagement monitoring workflow (Publish → Track → Update weights)
    - Test Knowledge Base upload workflow (Upload → Parse → Embed → Index)
    - _Requirements: All workflow requirements_

  - [ ] 19.3 Perform load testing
    - Test 1000 concurrent users triggering workflows
    - Test bulk upload of 10,000 historical posts
    - Test 100 voice notes processed in 1 minute
    - Verify performance targets met (trend scanning < 30s, draft generation < 10s)
    - _Requirements: Performance requirements_

  - [ ] 19.4 Verify cost optimization
    - Confirm per-user cost < $10/month
    - Verify rate limiting prevents quota exhaustion
    - Check caching reduces redundant API calls
    - _Requirements: 11.1, 11.2, 11.3, 11.7, 11.8_

  - [ ] 19.5 Security audit
    - Verify all data encrypted at rest and in transit
    - Confirm IAM roles follow least-privilege principle
    - Check credentials stored in Secrets Manager only
    - Verify no passwords in logs
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 19.6 Final user acceptance
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using hypothesis library (100 iterations minimum)
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: data models → utilities → Lambda functions → orchestration
- All Lambda functions use Python 3.12 with ARM64 Graviton2 for cost efficiency
- Infrastructure is deployed using AWS CDK or Terraform for reproducibility
