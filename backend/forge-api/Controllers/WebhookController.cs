using ForgeApi.DTOs;
using ForgeApi.DTOs.Webhooks;
using ForgeApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ForgeApi.Controllers;

[ApiController]
[Route("api/webhooks")]
[Authorize]
public class WebhookController : ControllerBase
{
    private readonly IWebhookService _webhookService;
    private readonly ICurrentOrganizationProvider _orgProvider;

    public WebhookController(IWebhookService webhookService, ICurrentOrganizationProvider orgProvider)
    {
        _webhookService = webhookService;
        _orgProvider = orgProvider;
    }

    [HttpPost]
    public async Task<IActionResult> Register([FromBody] RegisterWebhookRequest request)
    {
        var result = await _webhookService.RegisterEndpointAsync(_orgProvider.OrganizationId, request);
        return Ok(ApiResponse<WebhookEndpointResponse>.Ok(result, "Webhook endpoint registered."));
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var endpoints = await _webhookService.GetEndpointsAsync(_orgProvider.OrganizationId);
        return Ok(ApiResponse<IEnumerable<WebhookEndpointResponse>>.Ok(endpoints));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Remove(Guid id)
    {
        await _webhookService.RemoveEndpointAsync(id, _orgProvider.OrganizationId);
        return Ok(ApiResponse.Ok(message: "Webhook endpoint removed."));
    }

    [HttpPost("{id:guid}/test")]
    public async Task<IActionResult> Test(Guid id)
    {
        await _webhookService.TestEndpointAsync(id, _orgProvider.OrganizationId);
        return Ok(ApiResponse.Ok(message: "Test webhook sent."));
    }

    [HttpGet("{id:guid}/deliveries")]
    public async Task<IActionResult> Deliveries(Guid id)
    {
        var deliveries = await _webhookService.GetDeliveriesAsync(id, _orgProvider.OrganizationId);
        return Ok(ApiResponse<IEnumerable<WebhookDeliveryResponse>>.Ok(deliveries));
    }

    [HttpPost("deliveries/{id:guid}/retry")]
    public async Task<IActionResult> Retry(Guid id)
    {
        await _webhookService.RetryDeliveryAsync(id, _orgProvider.OrganizationId);
        return Ok(ApiResponse.Ok(message: "Webhook delivery retried."));
    }
}
