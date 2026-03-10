using ForgeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ForgeApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<Payout> Payouts => Set<Payout>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Email).IsRequired();
            entity.Property(u => u.PasswordHash).IsRequired();
        });

        // ApiKey
        modelBuilder.Entity<ApiKey>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.HasIndex(a => a.Key).IsUnique();
            entity.Property(a => a.Key).IsRequired();

            entity.HasOne(a => a.User)
                  .WithMany(u => u.ApiKeys)
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Transaction
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Amount).HasColumnType("numeric(18,2)");
            entity.Property(t => t.Currency).IsRequired();
            entity.Property(t => t.Status).IsRequired().HasDefaultValue("pending");

            entity.HasOne(t => t.User)
                  .WithMany(u => u.Transactions)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Payout
        modelBuilder.Entity<Payout>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.BankAccount).IsRequired();
            entity.Property(p => p.Status).IsRequired().HasDefaultValue("pending");

            entity.HasOne(p => p.Transaction)
                  .WithOne(t => t.Payout)
                  .HasForeignKey<Payout>(p => p.TransactionId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
