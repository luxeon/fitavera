package com.fitavera.payment.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitavera.common.annotation.IntegrationTest;
import com.fitavera.payment.rest.model.ClientTrainingCreditsSummaryResponse;
import com.fitavera.user.repository.entity.UserRole;
import com.fitavera.user.util.JwtTokenCreator;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static com.fitavera.common.util.TestUtils.readFile;
import static net.javacrumbs.jsonunit.spring.JsonUnitResultMatchers.json;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@IntegrationTest
@Sql({"/db/tenant/insert.sql", "/db/user/insert.sql", "/db/training/insert.sql", "/db/client/insert.sql"})
class ClientPaymentRestControllerTest {

    private static final String BASE_URL = "/api/tenants/7a7632b1-e932-48fd-9296-001036b4ec19";
    private static final UUID DIFFERENT_TENANT_ID = UUID.fromString("b35ac7f5-3e4f-462a-a76d-524bd3a5fd03");
    private static final UUID EXISTING_CLIENT_ID = UUID.fromString("c35ac7f5-3e4f-462a-a76d-524bd3a5fd01");
    private static final UUID EXISTING_PAYMENT_ID = UUID.fromString("d35ac7f5-3e4f-462a-a76d-524bd3a5fd02");
    private static final UUID NON_EXISTING_PAYMENT_ID = UUID.fromString("d35ac7f5-3e4f-462a-a76d-524bd3a5fd99");
    private static final UUID EXISTING_TRAINING_ID = UUID.fromString("ae4d661a-ed70-4e36-9caf-048ee8060290");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenCreator jwtTokenCreator;
    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void create_whenValidRequest_thenCreatePayment() throws Exception {
        var request = readFile("fixture/payment/create/request/valid-request.json");
        var expectedResponse = readFile("fixture/payment/create/response/success.json");

        mockMvc.perform(post(BASE_URL + "/clients/{clientId}/payments", EXISTING_CLIENT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken()))
                .andExpect(status().isCreated())
                .andExpect(json().isEqualTo(expectedResponse));
    }

    @Test
    void create_whenInvalidRequest_thenReturnBadRequest() throws Exception {
        var request = readFile("fixture/payment/create/request/invalid-request.json");
        var expectedResponse = readFile("fixture/payment/create/response/invalid-request.json");

        mockMvc.perform(post(BASE_URL + "/clients/{clientId}/payments", EXISTING_CLIENT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken()))
                .andExpect(status().isBadRequest())
                .andExpect(json().isEqualTo(expectedResponse));
    }

    @Test
    void create_whenJwtTokenDoesNotExist_thenReturn401() throws Exception {
        var request = readFile("fixture/payment/create/request/valid-request.json");

        mockMvc.perform(post(BASE_URL + "/clients/{clientId}/payments", EXISTING_CLIENT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void create_whenUserHasDifferentTenant_thenReturn403() throws Exception {
        var request = readFile("fixture/payment/create/request/valid-request.json");
        var expectedResponse = readFile("fixture/payment/create/response/access-denied.json");

        mockMvc.perform(post("/api/tenants/{tenantId}/clients/{clientId}/payments", DIFFERENT_TENANT_ID, EXISTING_CLIENT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken()))
                .andExpect(status().isForbidden())
                .andExpect(json().isEqualTo(expectedResponse));
    }

    @ParameterizedTest
    @EnumSource(value = UserRole.Name.class, names = {"CLIENT"})
    void create_whenUserHasUnauthorizedRole_thenReturn403(UserRole.Name role) throws Exception {
        var request = readFile("fixture/payment/create/request/valid-request.json");

        mockMvc.perform(post(BASE_URL + "/clients/{clientId}/payments", EXISTING_CLIENT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateTestJwtToken(role)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Sql("/db/payment/insert.sql")
    void cancel_whenValidRequest_thenCancelPayment() throws Exception {
        var expectedResponse = readFile("fixture/payment/cancel/response/success.json");

        mockMvc.perform(post(BASE_URL + "/clients/{clientId}/payments/{paymentId}/cancel", EXISTING_CLIENT_ID, EXISTING_PAYMENT_ID)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken()))
                .andExpect(status().isOk())
                .andExpect(json().isEqualTo(expectedResponse));
    }

    @Test
    void cancel_whenPaymentNotFound_thenReturn404() throws Exception {
        var expectedResponse = readFile("fixture/payment/cancel/response/not-found.json");

        mockMvc.perform(post(BASE_URL + "/clients/{clientId}/payments/{paymentId}/cancel", EXISTING_CLIENT_ID, NON_EXISTING_PAYMENT_ID)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken()))
                .andExpect(status().isNotFound())
                .andExpect(json().isEqualTo(expectedResponse));
    }

    @Test
    void cancel_whenJwtTokenDoesNotExist_thenReturn401() throws Exception {
        mockMvc.perform(post(BASE_URL + "/clients/{clientId}/payments/{paymentId}/cancel", EXISTING_CLIENT_ID, EXISTING_PAYMENT_ID))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cancel_whenUserHasDifferentTenant_thenReturn403() throws Exception {
        var expectedResponse = readFile("fixture/payment/cancel/response/access-denied.json");

        mockMvc.perform(post("/api/tenants/{tenantId}/clients/{clientId}/payments/{paymentId}/cancel",
                        DIFFERENT_TENANT_ID, EXISTING_CLIENT_ID, EXISTING_PAYMENT_ID)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken()))
                .andExpect(status().isForbidden())
                .andExpect(json().isEqualTo(expectedResponse));
    }

    @ParameterizedTest
    @EnumSource(value = UserRole.Name.class, names = {"CLIENT"})
    void cancel_whenUserHasUnauthorizedRole_thenReturn403(UserRole.Name role) throws Exception {
        mockMvc.perform(post(BASE_URL + "/clients/{clientId}/payments/{paymentId}/cancel", EXISTING_CLIENT_ID, EXISTING_PAYMENT_ID)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateTestJwtToken(role)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Sql("/db/payment/insert.sql")
    void findAll_whenValidRequest_thenReturnPayments() throws Exception {
        var expectedResponse = readFile("fixture/payment/findAll/response/success.json");

        mockMvc.perform(get(BASE_URL + "/clients/{clientId}/payments", EXISTING_CLIENT_ID)
                        .param("page", "0")
                        .param("size", "10")
                        .param("sort", "createdAt,desc")
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken()))
                .andExpect(status().isOk())
                .andExpect(json().isEqualTo(expectedResponse));
    }

    @Test
    void findAll_whenJwtTokenDoesNotExist_thenReturn401() throws Exception {
        mockMvc.perform(get(BASE_URL + "/clients/{clientId}/payments", EXISTING_CLIENT_ID))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void findAll_whenUserHasDifferentTenant_thenReturn403() throws Exception {
        var expectedResponse = readFile("fixture/payment/findAll/response/access-denied.json");

        mockMvc.perform(get("/api/tenants/{tenantId}/clients/{clientId}/payments", DIFFERENT_TENANT_ID, EXISTING_CLIENT_ID)
                        .param("page", "0")
                        .param("size", "10")
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken()))
                .andExpect(status().isForbidden())
                .andExpect(json().isEqualTo(expectedResponse));
    }

    @Test
    @Sql("/db/payment/insert.sql")
    void findAllInTenant_whenValidRequest_thenReturnPayments() throws Exception {
        var expectedResponse = readFile("fixture/payment/findAllInTenant/response/success.json");

        mockMvc.perform(get(BASE_URL + "/payments")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sort", "createdAt,desc")
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken()))
                .andExpect(status().isOk())
                .andExpect(json().isEqualTo(expectedResponse));
    }

    @Test
    void findAllInTenant_whenJwtTokenDoesNotExist_thenReturn401() throws Exception {
        mockMvc.perform(get(BASE_URL + "/payments"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void findAllInTenant_whenUserHasDifferentTenant_thenReturn403() throws Exception {
        var expectedResponse = readFile("fixture/payment/findAllInTenant/response/access-denied.json");

        mockMvc.perform(get("/api/tenants/{tenantId}/payments", DIFFERENT_TENANT_ID)
                        .param("page", "0")
                        .param("size", "10")
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken()))
                .andExpect(status().isForbidden())
                .andExpect(json().isEqualTo(expectedResponse));
    }

    @ParameterizedTest
    @EnumSource(value = UserRole.Name.class, names = {"CLIENT"})
    void findAllInTenant_whenUserHasUnauthorizedRole_thenReturn403(UserRole.Name role) throws Exception {
        mockMvc.perform(get(BASE_URL + "/payments")
                        .param("page", "0")
                        .param("size", "10")
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateTestJwtToken(role)))
                .andExpect(status().isForbidden());
    }

    @Test
    void getCreditsSummary_whenNoPayments_returnsEmptySummary() throws Exception {
        var expectedResponse = readFile("fixture/payment/getCreditsSummary/response/no-payments.json");

        mockMvc.perform(get(BASE_URL + "/clients/{clientId}/trainings/{trainingId}/credits/summary", EXISTING_CLIENT_ID, EXISTING_TRAINING_ID)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken()))
                .andExpect(status().isOk())
                .andExpect(json().isEqualTo(expectedResponse));
    }

    @Test
    void getCreditsSummary_withPayment_returnsCorrectSummary() throws Exception {
        var request = readFile("fixture/payment/create/request/valid-request.json");

        mockMvc.perform(post(BASE_URL + "/clients/{clientId}/payments", EXISTING_CLIENT_ID)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated());

        mockMvc.perform(post(BASE_URL + "/clients/{clientId}/payments", EXISTING_CLIENT_ID)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated());

        String response = mockMvc.perform(get(BASE_URL + "/clients/{clientId}/trainings/{trainingId}/credits/summary", EXISTING_CLIENT_ID, EXISTING_TRAINING_ID)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        ClientTrainingCreditsSummaryResponse summary = objectMapper.readValue(response, ClientTrainingCreditsSummaryResponse.class);
        Assertions.assertThat(summary.remainingTrainings()).isEqualTo(20);
        Assertions.assertThat(summary.expiresAt().toLocalDate()).isEqualTo(LocalDate.now().plusDays(60));
    }

    @Test
    @Sql("/db/payment/insert.sql")
    void getCreditsSummary_afterPaymentCancellation_returnsUpdatedSummary() throws Exception {
        mockMvc.perform(post(BASE_URL + "/clients/{clientId}/payments/{paymentId}/cancel", EXISTING_CLIENT_ID, "d35ac7f5-3e4f-462a-a76d-524bd3a5fd02")
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken()))
                .andExpect(status().isOk());

        var expectedResponse = readFile("fixture/payment/getCreditsSummary/response/after-cancellation.json");

        mockMvc.perform(get(BASE_URL + "/clients/{clientId}/trainings/{trainingId}/credits/summary", EXISTING_CLIENT_ID, EXISTING_TRAINING_ID)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken()))
                .andExpect(status().isOk())
                .andExpect(json().isEqualTo(expectedResponse));
    }

    @Test
    @Sql("/db/payment/insert.sql")
    void getCreditsSummary_asClient_returnsCorrectSummary() throws Exception {
        var expectedResponse = readFile("fixture/payment/getCreditsSummary/response/as-client.json");

        mockMvc.perform(get(BASE_URL + "/clients/{clientId}/trainings/{trainingId}/credits/summary", EXISTING_CLIENT_ID, EXISTING_TRAINING_ID)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateTestJwtToken("james.bond@example.com", UserRole.Name.CLIENT)))
                .andExpect(status().isOk())
                .andExpect(json().isEqualTo(expectedResponse));
    }

    @Test
    void getCreditsSummary_asUnauthorizedClient_returnsForbidden() throws Exception {
        UUID unauthorizedClientId = UUID.fromString("c35ac7f5-3e4f-462a-a76d-524bd3a5fd02");

        mockMvc.perform(get(BASE_URL + "/clients/{clientId}/trainings/{trainingId}/credits/summary", unauthorizedClientId, EXISTING_TRAINING_ID)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateTestJwtToken(UserRole.Name.CLIENT)))
                .andExpect(status().isForbidden());
    }

    @Test
    void getCreditsSummary_withInvalidTenant_returnsForbidden() throws Exception {
        var expectedResponse = readFile("fixture/payment/getCreditsSummary/response/access-denied.json");

        mockMvc.perform(get("/api/tenants/{tenantId}/clients/{clientId}/trainings/{trainingId}/credits/summary",
                        DIFFERENT_TENANT_ID, EXISTING_CLIENT_ID, EXISTING_TRAINING_ID)
                        .header(HttpHeaders.AUTHORIZATION, jwtTokenCreator.generateAdminTestJwtToken()))
                .andExpect(status().isForbidden())
                .andExpect(json().isEqualTo(expectedResponse));
    }
} 