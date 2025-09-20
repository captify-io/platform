// Allow users in captify group to create user records
permit(
    principal is CaptifyPlatform::User,
    action == CaptifyPlatform::Action::"create",
    resource is CaptifyPlatform::UserRecord
)
when {
    principal.groups.contains("captify") &&
    resource.tableName == "captify-core-User" &&
    resource.tenantId == principal.tenantId
};

// Allow users to view their own user records
permit(
    principal is CaptifyPlatform::User,
    action == CaptifyPlatform::Action::"view",
    resource is CaptifyPlatform::UserRecord
)
when {
    principal.groups.contains("captify") &&
    resource.ownerId == principal.id &&
    resource.tenantId == principal.tenantId
};

// Allow users to update their own user records
permit(
    principal is CaptifyPlatform::User,
    action == CaptifyPlatform::Action::"update",
    resource is CaptifyPlatform::UserRecord
)
when {
    principal.groups.contains("captify") &&
    resource.ownerId == principal.id &&
    resource.tenantId == principal.tenantId
};