using ForgeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrganizationMember> OrganizationMembers => Set<OrganizationMember>();
    public DbSet<Bank> Banks => Set<Bank>();
    public DbSet<BankAlias> BankAliases => Set<BankAlias>();
    public DbSet<PayoutBatch> PayoutBatches => Set<PayoutBatch>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Payout> Payouts => Set<Payout>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<WebhookEndpoint> WebhookEndpoints => Set<WebhookEndpoint>();
    public DbSet<WebhookDelivery> WebhookDeliveries => Set<WebhookDelivery>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── User ────────────────────────────────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Email).IsRequired();
            entity.Property(u => u.PasswordHash).IsRequired();
        });

        // ── Organization ────────────────────────────────────────────────
        modelBuilder.Entity<Organization>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.Name).IsRequired().HasMaxLength(200);
            entity.Property(o => o.Email).IsRequired().HasMaxLength(200);
            entity.Property(o => o.Country).IsRequired().HasMaxLength(100);
            entity.HasIndex(o => o.Email).IsUnique();
        });

        // ── OrganizationMember ──────────────────────────────────────────
        modelBuilder.Entity<OrganizationMember>(entity =>
        {
            entity.HasKey(om => om.Id);
            entity.Property(om => om.Role).IsRequired().HasMaxLength(20);

            entity.HasOne(om => om.User)
                  .WithMany(u => u.OrganizationMemberships)
                  .HasForeignKey(om => om.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(om => om.Organization)
                  .WithMany(o => o.Members)
                  .HasForeignKey(om => om.OrganizationId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(om => new { om.UserId, om.OrganizationId }).IsUnique();
        });

        // ── ApiKey ──────────────────────────────────────────────────────
        modelBuilder.Entity<ApiKey>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.HasIndex(a => a.KeyHash).IsUnique();
            entity.Property(a => a.KeyHash).IsRequired();
            entity.Property(a => a.KeyPrefix).IsRequired().HasMaxLength(20);
            entity.Property(a => a.LastUsedFromIp).HasMaxLength(45);

            entity.HasOne(a => a.User)
                  .WithMany(u => u.ApiKeys)
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Organization)
                  .WithMany(o => o.ApiKeys)
                  .HasForeignKey(a => a.OrganizationId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(a => a.Permissions).IsRequired().HasMaxLength(20).HasDefaultValue("read");
        });

        // ── Bank ────────────────────────────────────────────────────────
        modelBuilder.Entity<Bank>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.Name).IsRequired().HasMaxLength(200);
            entity.Property(b => b.Code).IsRequired().HasMaxLength(20);
            entity.Property(b => b.Country).IsRequired().HasMaxLength(100);
            entity.HasIndex(b => b.Name).IsUnique();
            entity.HasIndex(b => b.Code).IsUnique();
        });

        // ── BankAlias ───────────────────────────────────────────────────
        modelBuilder.Entity<BankAlias>(entity =>
        {
            entity.HasKey(ba => ba.Id);
            entity.Property(ba => ba.Alias).IsRequired().HasMaxLength(200);
            entity.HasIndex(ba => ba.Alias);

            entity.HasOne(ba => ba.Bank)
                  .WithMany(b => b.Aliases)
                  .HasForeignKey(ba => ba.BankId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── PayoutBatch ─────────────────────────────────────────────────
        modelBuilder.Entity<PayoutBatch>(entity =>
        {
            entity.HasKey(pb => pb.Id);
            entity.Property(pb => pb.FileName).IsRequired().HasMaxLength(500);
            entity.Property(pb => pb.TotalAmount).HasColumnType("numeric(18,2)");
            entity.Property(pb => pb.Status).IsRequired().HasMaxLength(30).HasDefaultValue("pending");

            entity.HasOne(pb => pb.Organization)
                  .WithMany(o => o.PayoutBatches)
                  .HasForeignKey(pb => pb.OrganizationId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pb => pb.CreatedBy)
                  .WithMany()
                  .HasForeignKey(pb => pb.CreatedByUserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(pb => pb.OrganizationId);
            entity.HasIndex(pb => pb.Status);
            entity.HasIndex(pb => pb.CreatedAt);

            entity.Property(pb => pb.RowVersion)
                  .IsRowVersion();
        });

        // ── Transaction ─────────────────────────────────────────────────
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Amount).HasColumnType("numeric(18,2)");
            entity.Property(t => t.Currency).IsRequired().HasMaxLength(10);
            entity.Property(t => t.Status).IsRequired().HasMaxLength(20).HasDefaultValue("pending");
            entity.Property(t => t.RecipientName).IsRequired().HasMaxLength(200);
            entity.Property(t => t.RawBankName).IsRequired().HasMaxLength(200);
            entity.Property(t => t.NormalizedBankName).HasMaxLength(200);
            entity.Property(t => t.AccountNumber).IsRequired().HasMaxLength(50);
            entity.Property(t => t.FailureReason).HasMaxLength(500);
            entity.Property(t => t.NormalizationConfidence).HasColumnType("numeric(5,4)");

            entity.HasOne(t => t.PayoutBatch)
                  .WithMany(b => b.Transactions)
                  .HasForeignKey(t => t.PayoutBatchId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.Organization)
                  .WithMany()
                  .HasForeignKey(t => t.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.Bank)
                  .WithMany()
                  .HasForeignKey(t => t.BankId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(t => t.Status);
            entity.HasIndex(t => t.PayoutBatchId);
            entity.HasIndex(t => t.OrganizationId);
            entity.HasIndex(t => t.CreatedAt);

            entity.Property(t => t.RowVersion)
                  .IsRowVersion();
        });

        // ── IdempotencyRecord ──────────────────────────────────────────
        modelBuilder.Entity<IdempotencyRecord>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.HasIndex(r => r.Key).IsUnique();
            entity.Property(r => r.Key).IsRequired().HasMaxLength(100);
            entity.Property(r => r.RequestPath).IsRequired().HasMaxLength(500);
            entity.Property(r => r.RequestHash).IsRequired().HasMaxLength(64);
            entity.HasIndex(r => r.ExpiresAt);
        });

        // ── AuditLog ───────────────────────────────────────────────────
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Id).UseIdentityAlwaysColumn();
            entity.Property(a => a.Action).IsRequired().HasMaxLength(100);
            entity.Property(a => a.EntityType).IsRequired().HasMaxLength(100);
            entity.Property(a => a.EntityId).HasMaxLength(100);
            entity.Property(a => a.IpAddress).HasMaxLength(45);
            entity.Property(a => a.UserAgent).HasMaxLength(500);

            entity.HasIndex(a => a.CreatedAt);
            entity.HasIndex(a => a.UserId);
            entity.HasIndex(a => a.OrganizationId);
            entity.HasIndex(a => a.Action);
        });

        // ── RefreshToken ───────────────────────────────────────────────
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(rt => rt.Id);
            entity.HasIndex(rt => rt.TokenHash).IsUnique();
            entity.Property(rt => rt.TokenHash).IsRequired();
            entity.Property(rt => rt.CreatedByIp).HasMaxLength(45);
            entity.Property(rt => rt.RevokedByIp).HasMaxLength(45);

            entity.HasOne(rt => rt.User)
                  .WithMany()
                  .HasForeignKey(rt => rt.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(rt => rt.UserId);
            entity.HasIndex(rt => rt.ExpiresAt);
        });

        // ── Notification ─────────────────────────────────────────────────
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(n => n.Id);
            entity.Property(n => n.Type).IsRequired().HasMaxLength(50);
            entity.Property(n => n.Title).IsRequired().HasMaxLength(200);
            entity.Property(n => n.Message).IsRequired().HasMaxLength(1000);
            entity.HasOne(n => n.Organization).WithMany().HasForeignKey(n => n.OrganizationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(n => n.User).WithMany().HasForeignKey(n => n.UserId).OnDelete(DeleteBehavior.SetNull);
            entity.HasIndex(n => n.OrganizationId);
            entity.HasIndex(n => n.UserId);
            entity.HasIndex(n => n.CreatedAt);
            entity.HasIndex(n => n.IsRead);
        });

        // ── WebhookEndpoint ─────────────────────────────────────────────
        modelBuilder.Entity<WebhookEndpoint>(entity =>
        {
            entity.HasKey(w => w.Id);
            entity.Property(w => w.Url).IsRequired().HasMaxLength(2000);
            entity.Property(w => w.Events).IsRequired().HasMaxLength(500);
            entity.Property(w => w.Secret).IsRequired().HasMaxLength(100);

            entity.HasOne(w => w.Organization)
                  .WithMany()
                  .HasForeignKey(w => w.OrganizationId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(w => w.OrganizationId);
            entity.HasIndex(w => w.IsActive);
        });

        // ── WebhookDelivery ─────────────────────────────────────────────
        modelBuilder.Entity<WebhookDelivery>(entity =>
        {
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Event).IsRequired().HasMaxLength(100);
            entity.Property(d => d.Payload).IsRequired();

            entity.HasOne(d => d.WebhookEndpoint)
                  .WithMany(w => w.Deliveries)
                  .HasForeignKey(d => d.WebhookEndpointId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(d => d.WebhookEndpointId);
            entity.HasIndex(d => d.CreatedAt);
            entity.HasIndex(d => d.NextRetryAt);
        });

        // ── Payout (legacy — will be removed in Task 8.1) ──────────────
        modelBuilder.Entity<Payout>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.BankAccount).IsRequired();
            entity.Property(p => p.Status).IsRequired().HasDefaultValue("pending");

            entity.HasOne(p => p.Transaction)
                  .WithMany()
                  .HasForeignKey(p => p.TransactionId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
