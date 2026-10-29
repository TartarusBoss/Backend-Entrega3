type ApiError = { error?: string };
type Product = {
  id: number;
  name: string;
  category: "futbol" | "basket" | "mma";
  price: number;
  description: string;
  image: string;
};
type ProductPage = {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: Product[];
};
type Session = {
  user: {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user";
    passwordHash?: string;
  };
  token: string;
};

const apiBaseUrl = process.env.API_BASE_URL?.replace(/\/+$/, "");
const frontendUrl = process.env.FRONTEND_URL;
const adminEmail = process.env.TEST_ADMIN_EMAIL;
const adminPassword = process.env.TEST_ADMIN_PASSWORD;

if (!apiBaseUrl || !frontendUrl || !adminEmail || !adminPassword) {
  throw new Error(
    "Configura API_BASE_URL, FRONTEND_URL, TEST_ADMIN_EMAIL y TEST_ADMIN_PASSWORD en el entorno.",
  );
}

const apiUrl = new URL(apiBaseUrl);
const expectedFrontendOrigin = new URL(frontendUrl).origin;
const smokeEmail = `verificacion-${Date.now()}@sportzone.test`;
const smokePassword = `Verificacion-${crypto.randomUUID()}-A1!`;
const smokeProductName = `Producto de verificacion ${Date.now()}`;

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response; body: T | ApiError | null }> {
  let response: Response;
  try {
    response = await fetch(new URL(path, apiUrl), init);
  } catch {
    throw new Error(`No fue posible conectar con ${apiUrl.origin}.`);
  }

  const body: unknown =
    response.status === 204 ? null : await response.json().catch(() => null);
  return { response, body: body as T | ApiError | null };
}

function assertStatus(
  actual: number,
  expected: number,
  description: string,
): void {
  if (actual !== expected) {
    throw new Error(
      `${description}: se esperaba HTTP ${expected}, se recibió HTTP ${actual}.`,
    );
  }
  console.log(`OK ${description} (HTTP ${actual})`);
}

function assertCondition(
  condition: boolean,
  description: string,
): asserts condition {
  if (!condition) {
    throw new Error(description);
  }
  console.log(`OK ${description}`);
}

function getToken(
  body: Session | ApiError | null,
  description: string,
): string {
  if (!body || !("token" in body) || typeof body.token !== "string") {
    throw new Error(`${description}: respuesta sin token válido.`);
  }
  return body.token;
}

async function login(email: string, password: string): Promise<Session> {
  const { response, body } = await request<Session>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assertStatus(response.status, 200, `Inicio de sesión de ${email}`);
  if (!body || !("user" in body) || !body.user || !("role" in body.user)) {
    throw new Error(
      "La respuesta de inicio de sesión no tiene la estructura esperada.",
    );
  }
  assertCondition(
    !("passwordHash" in body.user),
    "La API no expone el hash de contraseña",
  );
  return { user: body.user, token: getToken(body, "Inicio de sesión") };
}

async function verifyDeployment(): Promise<void> {
  assertCondition(
    apiUrl.protocol === "https:",
    "La API de producción usa HTTPS",
  );

  const { response: healthResponse, body: healthBody } = await request<{
    status: string;
  }>("/health");
  assertStatus(healthResponse.status, 200, "Comprobación de salud");
  assertCondition(
    Boolean(healthBody && "status" in healthBody && healthBody.status === "ok"),
    "La API informa estado saludable",
  );

  const preflight = await fetch(new URL("/api/auth/login", apiUrl), {
    method: "OPTIONS",
    headers: {
      Origin: expectedFrontendOrigin,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type",
    },
  });
  assertCondition(
    preflight.headers.get("access-control-allow-origin") ===
      expectedFrontendOrigin,
    "CORS permite el origen exacto del frontend",
  );

  const { response: catalogResponse, body: catalogBody } =
    await request<ProductPage>("/api/products?page=1&limit=2");
  assertStatus(catalogResponse.status, 200, "Catálogo público paginado");
  assertCondition(
    Boolean(
      catalogBody &&
      "pagination" in catalogBody &&
      catalogBody.pagination.page === 1 &&
      catalogBody.pagination.limit === 2 &&
      "data" in catalogBody &&
      Array.isArray(catalogBody.data) &&
      catalogBody.data.length > 0,
    ),
    "El catálogo devuelve paginación y productos",
  );
  const product = (catalogBody as ProductPage).data[0];

  const { response: invalidPageResponse } = await request(
    "/api/products?page=0",
  );
  assertStatus(
    invalidPageResponse.status,
    400,
    "La paginación inválida devuelve 400",
  );

  const { response: unauthenticatedResponse } = await request(
    `/api/products/${product.id}`,
    {
      method: "DELETE",
    },
  );
  assertStatus(
    unauthenticatedResponse.status,
    401,
    "Eliminar sin token devuelve 401",
  );

  const { response: registerResponse, body: registerBody } =
    await request<Session>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Usuario de verificación",
        email: smokeEmail,
        password: smokePassword,
      }),
    });
  assertStatus(
    registerResponse.status,
    201,
    "Registro de usuario de verificación",
  );
  const userToken = getToken(registerBody, "Registro");
  assertCondition(
    Boolean(
      registerBody &&
      "user" in registerBody &&
      registerBody.user.role === "user" &&
      !("passwordHash" in registerBody.user),
    ),
    "El registro crea un usuario sin devolver datos de contraseña",
  );

  const { response: duplicateResponse } = await request(`/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Usuario de verificación",
      email: smokeEmail,
      password: smokePassword,
    }),
  });
  assertStatus(
    duplicateResponse.status,
    409,
    "Registrar dos veces el mismo correo devuelve 409",
  );

  await login(smokeEmail, smokePassword);
  const { response: userForbiddenResponse } = await request(
    `/api/products/${product.id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${userToken}` },
    },
  );
  assertStatus(
    userForbiddenResponse.status,
    403,
    "Eliminar con un usuario normal devuelve 403",
  );

  const { response: createRequestResponse, body: createRequestBody } =
    await request("/api/requests", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: product.id,
        message: "Solicitud automatizada de verificación.",
      }),
    });
  assertStatus(
    createRequestResponse.status,
    201,
    "Crear una solicitud con sesión",
  );
  assertCondition(
    Boolean(
      createRequestBody &&
      typeof createRequestBody === "object" &&
      "userId" in createRequestBody &&
      createRequestBody.userId ===
        ("user" in (registerBody ?? {}) ? registerBody?.user.id : undefined),
    ),
    "La solicitud queda asociada al usuario autenticado",
  );

  const { response: myRequestsResponse, body: myRequestsBody } = await request<
    unknown[]
  >("/api/requests/mias", {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assertStatus(myRequestsResponse.status, 200, "Consultar mis solicitudes");
  assertCondition(
    Array.isArray(myRequestsBody),
    "Mis solicitudes devuelve una lista",
  );

  const admin = await login(adminEmail, adminPassword);
  assertCondition(
    admin.user.role === "admin",
    "La cuenta de prueba tiene rol administrador",
  );

  const productData = {
    name: smokeProductName,
    category: "mma",
    price: 12345,
    description: "Producto temporal para verificar el CRUD.",
    image: "https://example.com/sportzone-smoke-test.jpg",
  };
  const adminHeaders = {
    Authorization: `Bearer ${admin.token}`,
    "Content-Type": "application/json",
  };
  const { response: createProductResponse, body: createdProductBody } =
    await request<Product>("/api/products", {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(productData),
    });
  assertStatus(
    createProductResponse.status,
    201,
    "Admin crea un producto temporal",
  );
  const createdProduct =
    createdProductBody && "id" in createdProductBody
      ? (createdProductBody as Product)
      : null;
  if (!createdProduct || typeof createdProduct.id !== "number") {
    throw new Error("La API no devolvió el producto creado.");
  }

  try {
    const { response: updateResponse, body: updatedBody } =
      await request<Product>(`/api/products/${createdProduct.id}`, {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify({
          ...productData,
          name: `${smokeProductName} actualizado`,
        }),
      });
    assertStatus(
      updateResponse.status,
      200,
      "Admin actualiza un producto temporal",
    );
    assertCondition(
      Boolean(
        updatedBody &&
        "name" in updatedBody &&
        updatedBody.name === `${smokeProductName} actualizado`,
      ),
      "La actualización conserva los nuevos datos",
    );
  } catch (error) {
    throw error;
  } finally {
    const { response: deleteProductResponse } = await request(
      `/api/products/${createdProduct.id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${admin.token}` } },
    );
    if (deleteProductResponse.status !== 204) {
      throw new Error(
        `No se pudo limpiar el producto temporal: se esperaba HTTP 204, se recibió HTTP ${deleteProductResponse.status}.`,
      );
    }
    console.log("OK Admin elimina el producto temporal (HTTP 204)");
  }

  console.log(
    `\nVerificación terminada. Usuario de prueba creado: ${smokeEmail}`,
  );
  console.log(
    "La solicitud de prueba queda guardada en la base; elimínala manualmente si lo necesitas.",
  );
}

verifyDeployment().catch((error: unknown) => {
  console.error("Falló la verificación del despliegue:", error);
  process.exitCode = 1;
});
